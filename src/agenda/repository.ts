/**
 * Agenda persistence behind an interface so the local store can later be swapped for a
 * database (per user) without touching the UI. Async on purpose: a remote store will be.
 */
import type { AgendaEvent, AgendaPatch, EventType, NewAgendaEvent } from "./types";

export interface AgendaRepository {
  list(): Promise<AgendaEvent[]>;
  create(input: NewAgendaEvent): Promise<AgendaEvent>;
  update(id: string, patch: AgendaPatch): Promise<AgendaEvent>;
  remove(id: string): Promise<void>;
  /** Called whenever the stored events change (this tab or another one). */
  subscribe(listener: () => void): () => void;
}

export const AGENDA_STORAGE_KEY = "school-ai-world-agenda-v1";
/** Events created by the earlier "Mi espacio de estudio" agenda; imported once. */
export const LEGACY_STORAGE_KEY = "school-ai-world-v1";

interface StoredAgenda {
  version: 1;
  events: AgendaEvent[];
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

const LEGACY_TYPES: Record<string, EventType> = {
  Examen: "examen",
  Entrega: "entrega",
  Tarea: "deberes",
  Estudio: "estudio",
  Clase: "clase",
  Otro: "deberes",
};

function importLegacy(storage: StorageLike, now: string, makeId: () => string): AgendaEvent[] {
  try {
    const raw = storage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const legacy = JSON.parse(raw) as { events?: Array<Record<string, unknown>> };
    return (legacy.events ?? [])
      .filter((e) => typeof e["title"] === "string" && typeof e["date"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(String(e["date"])))
      .map((e) => ({
        id: typeof e["id"] === "string" ? String(e["id"]) : makeId(),
        title: String(e["title"]),
        type: LEGACY_TYPES[String(e["type"])] ?? "deberes",
        subject: e["subject"] ? String(e["subject"]) : null,
        date: String(e["date"]),
        time: e["start"] ? String(e["start"]) : null,
        endTime: e["end"] ? String(e["end"]) : null,
        notes: e["notes"] ? String(e["notes"]) : "",
        completed: Boolean(e["done"]),
        source: { kind: "web" as const },
        createdAt: now,
        updatedAt: now,
      }));
  } catch {
    return [];
  }
}

export function createLocalAgendaRepository(
  storage: StorageLike,
  opts: { now?: () => Date; id?: () => string; target?: Pick<Window, "addEventListener" | "removeEventListener"> } = {},
): AgendaRepository {
  const now = () => (opts.now ? opts.now() : new Date()).toISOString();
  const makeId = opts.id ?? (() => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const listeners = new Set<() => void>();

  const read = (): AgendaEvent[] => {
    const raw = storage.getItem(AGENDA_STORAGE_KEY);
    if (raw === null) {
      const imported = importLegacy(storage, now(), makeId);
      write(imported, false);
      return imported;
    }
    try {
      const parsed = JSON.parse(raw) as StoredAgenda;
      return Array.isArray(parsed.events) ? parsed.events : [];
    } catch {
      return [];
    }
  };
  const write = (events: AgendaEvent[], notify = true) => {
    storage.setItem(AGENDA_STORAGE_KEY, JSON.stringify({ version: 1, events } satisfies StoredAgenda));
    if (notify) listeners.forEach((l) => l());
  };

  return {
    async list() {
      return read();
    },
    async create(input) {
      const stamp = now();
      const event: AgendaEvent = {
        ...input,
        title: input.title.trim(),
        source: input.source ?? { kind: "web" },
        id: makeId(),
        completed: false,
        createdAt: stamp,
        updatedAt: stamp,
      };
      write([...read(), event]);
      return event;
    },
    async update(id, patch) {
      const events = read();
      const current = events.find((e) => e.id === id);
      if (!current) throw new Error("El evento ya no existe.");
      const next: AgendaEvent = { ...current, ...patch, id, updatedAt: now() };
      write(events.map((e) => (e.id === id ? next : e)));
      return next;
    },
    async remove(id) {
      write(read().filter((e) => e.id !== id));
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key === AGENDA_STORAGE_KEY) listener();
      };
      opts.target?.addEventListener("storage", onStorage as EventListener);
      return () => {
        listeners.delete(listener);
        opts.target?.removeEventListener("storage", onStorage as EventListener);
      };
    },
  };
}

let browserRepo: AgendaRepository | null = null;

/** The app-wide agenda. Call only in the browser (effects/handlers). */
export function getAgendaRepository(): AgendaRepository {
  browserRepo ??= createLocalAgendaRepository(window.localStorage, { target: window });
  return browserRepo;
}
