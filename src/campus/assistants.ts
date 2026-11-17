/** The six campus assistants. Names are shown in full everywhere — never abbreviate. */
export type AssistantId =
  | "profesor-particular"
  | "planificador-estudios-tareas"
  | "preparador-examenes"
  | "entrenador-exposiciones-orales"
  | "asistente-trabajos-proyectos"
  | "orientador-academico-profesional";

export interface Assistant {
  id: AssistantId;
  number: number;
  name: string;
  description: string;
  url: string;
}

export const ASSISTANTS: readonly Assistant[] = [
  {
    id: "profesor-particular",
    number: 1,
    name: "Profesor particular",
    description: "Explicaciones paso a paso y ayuda con tus asignaturas.",
    url: "https://gemini.google.com/gem/1XOeUy-EK4DbAuO9wESBDb1ZIEEmaip_5?usp=sharing",
  },
  {
    id: "planificador-estudios-tareas",
    number: 2,
    name: "Planificador de estudios y tareas",
    description: "Organiza tus horarios, deberes y sesiones de estudio.",
    url: "https://gemini.google.com/gem/1Oic5JUevA-1TPOph29PjX0_vOHZlSqmL?usp=sharing",
  },
  {
    id: "preparador-examenes",
    number: 3,
    name: "Preparador de exámenes",
    description: "Repasa contenidos y practica para preparar tus exámenes.",
    url: "https://gemini.google.com/gem/1hqcZy3CGT4C3aBysWqFUNRQkrLze5OwY?usp=sharing",
  },
  {
    id: "entrenador-exposiciones-orales",
    number: 4,
    name: "Entrenador de exposiciones orales",
    description: "Practica presentaciones, expresión oral y comunicación.",
    url: "https://gemini.google.com/gem/1hZNLTOxBkgsG4z2IS29rTc-yVjqW1pOQ?usp=sharing",
  },
  {
    id: "asistente-trabajos-proyectos",
    number: 5,
    name: "Asistente de trabajos y proyectos",
    description: "Prepara trabajos, investigaciones y proyectos escolares.",
    url: "https://gemini.google.com/gem/1SlMak_FI8iy1HVK8muV7roVL4-etviGu?usp=sharing",
  },
  {
    id: "orientador-academico-profesional",
    number: 6,
    name: "Orientador académico y profesional",
    description: "Explora opciones académicas y planifica tu futuro profesional.",
    url: "https://gemini.google.com/gem/1dyQEwZtwqQLtGeDoNDFJpmAL3cgO62FH?usp=sharing",
  },
];

export function isAssistantId(value: unknown): value is AssistantId {
  return typeof value === "string" && ASSISTANTS.some((a) => a.id === value);
}

export function getAssistant(id: AssistantId | null | undefined): Assistant | undefined {
  return id ? ASSISTANTS.find((a) => a.id === id) : undefined;
}

/**
 * Opens an assistant in the SAME tab so the browser Back button returns to the campus.
 * Never use window.open or an iframe here.
 */
export function openAssistant(url: string, location: Pick<Location, "assign"> = window.location) {
  location.assign(url);
}
