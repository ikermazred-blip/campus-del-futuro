import { describe, expect, it, vi } from "vitest";
import { ASSISTANTS, openAssistant } from "./assistants";
import { BUILDINGS } from "./layout";

describe("campus assistants", () => {
  it("has exactly the six assistants with full names and exact URLs, in order", () => {
    expect(ASSISTANTS.map((a) => [a.number, a.name, a.url])).toEqual([
      [1, "Profesor particular", "https://gemini.google.com/gem/1XOeUy-EK4DbAuO9wESBDb1ZIEEmaip_5?usp=sharing"],
      [2, "Planificador de estudios y tareas", "https://gemini.google.com/gem/1Oic5JUevA-1TPOph29PjX0_vOHZlSqmL?usp=sharing"],
      [3, "Preparador de exámenes", "https://gemini.google.com/gem/1hqcZy3CGT4C3aBysWqFUNRQkrLze5OwY?usp=sharing"],
      [4, "Entrenador de exposiciones orales", "https://gemini.google.com/gem/1hZNLTOxBkgsG4z2IS29rTc-yVjqW1pOQ?usp=sharing"],
      [5, "Asistente de trabajos y proyectos", "https://gemini.google.com/gem/1SlMak_FI8iy1HVK8muV7roVL4-etviGu?usp=sharing"],
      [6, "Orientador académico y profesional", "https://gemini.google.com/gem/1dyQEwZtwqQLtGeDoNDFJpmAL3cgO62FH?usp=sharing"],
    ]);
  });

  it("uses the given descriptions", () => {
    expect(ASSISTANTS.map((a) => a.description)).toEqual([
      "Explicaciones paso a paso y ayuda con tus asignaturas.",
      "Organiza tus horarios, deberes y sesiones de estudio.",
      "Repasa contenidos y practica para preparar tus exámenes.",
      "Practica presentaciones, expresión oral y comunicación.",
      "Prepara trabajos, investigaciones y proyectos escolares.",
      "Explora opciones académicas y planifica tu futuro profesional.",
    ]);
  });

  it("opens an assistant in the same tab via location.assign", () => {
    const assign = vi.fn();
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    openAssistant(ASSISTANTS[2]!.url, { assign });
    expect(assign).toHaveBeenCalledWith("https://gemini.google.com/gem/1hqcZy3CGT4C3aBysWqFUNRQkrLze5OwY?usp=sharing");
    expect(open).not.toHaveBeenCalled();
  });

  it("gives every assistant its own building", () => {
    expect(BUILDINGS.map((b) => b.id).sort()).toEqual(ASSISTANTS.map((a) => a.id).sort());
  });
});
