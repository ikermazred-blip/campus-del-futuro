/** Shared SCHOOL AI WORLD agenda (pure types). One agenda for the whole campus, never one per assistant. */
import type { AssistantId } from "@/campus/assistants";

export type EventType = "examen" | "entrega" | "deberes" | "clase" | "estudio";

export const EVENT_TYPES: readonly EventType[] = ["examen", "entrega", "deberes", "clase", "estudio"];

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  examen: "Examen",
  entrega: "Entrega",
  deberes: "Deberes",
  clase: "Clase",
  estudio: "Sesión de estudio",
};

/**
 * Who created the event. Today only the web form ("web") writes to the agenda.
 * "assistant" is reserved for a future, real integration with the six assistants.
 */
export type AgendaSource = { kind: "web" } | { kind: "assistant"; assistantId: AssistantId };

export interface AgendaEvent {
  id: string;
  title: string;
  type: EventType;
  subject: string | null;
  /** Europe/Madrid calendar day, YYYY-MM-DD */
  date: string;
  /** Europe/Madrid wall-clock time, HH:MM; null = all day */
  time: string | null;
  endTime: string | null;
  notes: string;
  completed: boolean;
  source: AgendaSource;
  createdAt: string;
  updatedAt: string;
}

export type NewAgendaEvent = Omit<AgendaEvent, "id" | "completed" | "createdAt" | "updatedAt" | "source"> & {
  source?: AgendaSource;
};

export type AgendaPatch = Partial<Omit<AgendaEvent, "id" | "createdAt" | "updatedAt">>;
