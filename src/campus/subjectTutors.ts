import type { SubjectId } from "./subjects";

export interface SubjectTutor {
  subjectId: SubjectId;
  name: string;
  url: string;
}

export const SUBJECT_TUTORS: readonly SubjectTutor[] = [
  { subjectId: "matematicas", name: "Profesor de Matemáticas", url: "https://gemini.google.com/gem/1kcxUVUwogUxzeAzfdci09wTYLA5Dzj7A?usp=sharing" },
  { subjectId: "fisica", name: "Profesor de Física", url: "https://gemini.google.com/gem/1aluAVCm6dA8wvSN14nRgJ2ZWUvtWGEf8?usp=sharing" },
  { subjectId: "quimica", name: "Profesor de Química", url: "https://gemini.google.com/gem/1q0up7-qidG7imIQ5E3Di-WauQSoazho7?usp=sharing" },
  { subjectId: "lengua", name: "Profesor de Lengua Castellana y Literatura", url: "https://gemini.google.com/gem/1eF81tOqRHG_FPNjMrBMj7hC8CPDhzqWD?usp=sharing" },
  { subjectId: "historia", name: "Profesor de Historia", url: "https://gemini.google.com/gem/1bu_T0eoiGKauHWvRlc-1iIZPTf67kXBe?usp=sharing" },
  { subjectId: "filosofia", name: "Profesor de Filosofía", url: "https://gemini.google.com/gem/1puWCpmw4fFzTS0MfOasyRxj_Gvcl2GIa?usp=sharing" },
  { subjectId: "ingles", name: "Profesor de Inglés", url: "https://gemini.google.com/gem/1ujIjo0yXn5rf8R-R6lyIG5DWS-tRSB2a?usp=sharing" },
  { subjectId: "frances", name: "Profesor de Francés", url: "https://gemini.google.com/gem/1CMDMHsqVt4aqL-GJr7sHvszHV2Lt0E2H?usp=sharing" },
  { subjectId: "dibujo-tecnico", name: "Profesor de Dibujo Técnico", url: "https://gemini.google.com/gem/17SDBDHeFh170qQjVSL59lFesbeta_1JY?usp=sharing" },
  { subjectId: "biologia", name: "Profesor de Biología", url: "https://gemini.google.com/gem/1119Yc1zKofy2q7QlmVN9ys-SlEiaeMKY?usp=sharing" },
  { subjectId: "tecnologia-ingenieria", name: "Profesor de Tecnología e Ingeniería", url: "https://gemini.google.com/gem/1k1YJtsy4W98w_7KX5XBmyifd1FXgCEid?usp=sharing" },
  { subjectId: "economia", name: "Profesor de Economía", url: "https://gemini.google.com/gem/1mASqB2P7Ec_GJ8F5B5Vg16WTLMikMry6?usp=sharing" },
];

export function getSubjectTutor(id: SubjectId): SubjectTutor {
  const tutor = SUBJECT_TUTORS.find((item) => item.subjectId === id);
  if (!tutor) throw new Error(`No hay un tutor configurado para la asignatura: ${id}`);
  return tutor;
}

/** Each subject has one Gem that supports four distinct working modes. */
export const TUTOR_MODES = [
  {
    title: "Profesor particular",
    description: "Teoría, explicaciones claras y resolución de dudas paso a paso.",
  },
  {
    title: "Entrenador de ejercicios",
    description: "Práctica gradual, corrección del procedimiento y detección de errores.",
  },
  {
    title: "Preparador de exámenes",
    description: "Simulacros, preguntas de práctica, corrección y feedback.",
  },
  {
    title: "Experto en apuntes",
    description: "Trabaja con tus PDF, fotografías y documentos para resumir y organizar contenidos.",
  },
] as const;
