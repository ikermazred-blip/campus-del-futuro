import type { CharacterModel, Pose } from "./rooms";

export type SubjectId =
  | "matematicas" | "fisica" | "quimica" | "lengua" | "historia" | "filosofia"
  | "ingles" | "frances" | "dibujo-tecnico" | "biologia" | "tecnologia-ingenieria" | "economia";

export interface CampusSubject {
  id: SubjectId;
  name: string;
  description: string;
  x: number;
  z: number;
  model: CharacterModel;
  pose: Pose;
  accent: string;
}

export const SUBJECTS: readonly CampusSubject[] = [
  { id: "matematicas", name: "Matemáticas", description: "Teoría, problemas y razonamiento matemático.", x: -30, z: -24, model: "profesor", pose: "sitDesk", accent: "#2878a5" },
  { id: "fisica", name: "Física", description: "Comprende los fenómenos y resuelve problemas paso a paso.", x: -10, z: -24, model: "proyectos", pose: "workBench", accent: "#4b7892" },
  { id: "quimica", name: "Química", description: "Formulación, reacciones, cálculos y prácticas.", x: 10, z: -24, model: "proyectos", pose: "workBench", accent: "#45836b" },
  { id: "lengua", name: "Lengua Castellana y Literatura", description: "Gramática, comentario de texto y literatura.", x: 30, z: -24, model: "orientadora", pose: "sitRead", accent: "#9a6b45" },
  { id: "historia", name: "Historia", description: "Procesos históricos, conceptos y análisis de fuentes.", x: -30, z: 0, model: "preparador", pose: "sitRead", accent: "#a47742" },
  { id: "filosofia", name: "Filosofía", description: "Autores, teorías, argumentos y conceptos.", x: -10, z: 0, model: "orientadora", pose: "sitDesk", accent: "#8065a5" },
  { id: "ingles", name: "Inglés", description: "Grammar, vocabulary, reading and speaking.", x: 10, z: 0, model: "entrenadora", pose: "present", accent: "#4b78b5" },
  { id: "frances", name: "Francés", description: "Grammaire, vocabulaire et expression orale.", x: 30, z: 0, model: "planificadora", pose: "sitDesk", accent: "#a65b78" },
  { id: "dibujo-tecnico", name: "Dibujo Técnico", description: "Geometría, construcciones y sistemas de representación.", x: -30, z: 24, model: "proyectos", pose: "workBench", accent: "#477d78" },
  { id: "biologia", name: "Biología", description: "Conceptos, procesos y organización de los seres vivos.", x: -10, z: 24, model: "profesor", pose: "sitDesk", accent: "#6d914d" },
  { id: "tecnologia-ingenieria", name: "Tecnología e Ingeniería", description: "Diseño, sistemas, materiales y resolución de proyectos.", x: 10, z: 24, model: "proyectos", pose: "workBench", accent: "#647d8f" },
  { id: "economia", name: "Economía", description: "Conceptos económicos, gráficos y casos prácticos.", x: 30, z: 24, model: "planificadora", pose: "sitDesk", accent: "#a18a43" },
];

 
/** Reflows the visible classrooms into a compact, centered grid. */
export function getSubjectLayout(ids: readonly SubjectId[]): Record<SubjectId, { x: number; z: number }> {
  const result = {} as Record<SubjectId, { x: number; z: number }>;
  const count = ids.length;
  if (!count) return result;
  const columns = count <= 2 ? count : count <= 9 ? 3 : 4;
  const rows = Math.ceil(count / columns);
  const spacing = 24.5;
  ids.forEach((id, index) => {
    const row = Math.floor(index / columns);
    const rowStart = row * columns;
    const itemsInRow = Math.min(columns, count - rowStart);
    const column = index - rowStart;
    result[id] = {
      x: (column - (itemsInRow - 1) / 2) * spacing,
      z: (row - (rows - 1) / 2) * spacing,
    };
  });
  return result;
}

export function isSubjectId(value: unknown): value is SubjectId {
  return typeof value === "string" && SUBJECTS.some((subject) => subject.id === value);
}

export function getSubject(id: SubjectId | null | undefined): CampusSubject | undefined {
  return id ? SUBJECTS.find((subject) => subject.id === id) : undefined;
}
