/** Pure agenda queries: sorting, filters, upcoming list and warnings. */
import { diffDays } from "./dates";
import type { AgendaEvent, EventType } from "./types";

export interface AgendaFilters {
  type: EventType | "todos";
  subject: string | "todas";
  showCompleted: boolean;
}

export const DEFAULT_FILTERS: AgendaFilters = { type: "todos", subject: "todas", showCompleted: false };

/** Days ahead that count as "próximo" for exam and deadline warnings. */
export const WARNING_DAYS = 7;

export function sortEvents(events: readonly AgendaEvent[]) {
  return [...events].sort((a, b) => (a.date + (a.time ?? "00:00")).localeCompare(b.date + (b.time ?? "00:00")));
}

export function applyFilters(events: readonly AgendaEvent[], f: AgendaFilters) {
  return events.filter(
    (e) =>
      (f.type === "todos" || e.type === f.type) &&
      (f.subject === "todas" || (e.subject ?? "") === f.subject) &&
      (f.showCompleted || !e.completed),
  );
}

export function subjectsOf(events: readonly AgendaEvent[]) {
  return Array.from(new Set(events.map((e) => e.subject).filter((s): s is string => Boolean(s)))).sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

/** Events from today onwards (Europe/Madrid), soonest first. */
export function upcoming(events: readonly AgendaEvent[], today: string) {
  return sortEvents(events.filter((e) => e.date >= today));
}

export interface AgendaWarning {
  event: AgendaEvent;
  kind: "vencido" | "proximo";
  daysLeft: number;
}

/**
 * Warnings shown at the top of the agenda:
 * - pending exams and deadlines (entregas) within the next WARNING_DAYS days, today included;
 * - any pending event whose day has already passed.
 */
export function warnings(events: readonly AgendaEvent[], today: string): AgendaWarning[] {
  const out: AgendaWarning[] = [];
  for (const event of sortEvents(events)) {
    if (event.completed) continue;
    const daysLeft = diffDays(today, event.date);
    if (daysLeft < 0) out.push({ event, kind: "vencido", daysLeft });
    else if (daysLeft <= WARNING_DAYS && (event.type === "examen" || event.type === "entrega")) {
      out.push({ event, kind: "proximo", daysLeft });
    }
  }
  return out;
}
