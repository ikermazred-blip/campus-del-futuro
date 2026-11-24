import { describe, expect, it } from "vitest";
import { madridNow } from "./dates";
import { parseEventText } from "./parser";
import { createLocalAgendaRepository, AGENDA_STORAGE_KEY, LEGACY_STORAGE_KEY } from "./repository";
import { warnings } from "./selectors";
import type { AgendaEvent } from "./types";

// Tuesday 24 November 2026, 11:00 in Madrid
const NOW = new Date("2026-11-24T10:00:00Z");

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), data };
}

describe("natural language parser (Europe/Madrid)", () => {
  it("reads the example sentence: exam, Matemáticas, next week's Tuesday at 9:00", () => {
    const r = parseEventText("La semana que viene tengo un examen el martes a las 9:00 de Matemáticas", { now: NOW });
    expect(r.draft).toMatchObject({ type: "examen", subject: "Matemáticas", date: "2026-12-01", time: "09:00" });
    expect(r.questions).toEqual([]);
  });

  it("asks instead of guessing when the weekday is today", () => {
    const r = parseEventText("El martes tengo examen de Inglés a las 10:00", { now: NOW });
    expect(r.draft.date).toBeNull();
    expect(r.questions.find((q) => q.field === "date")?.options.map((o) => o.value)).toEqual(["2026-11-24", "2026-12-01"]);
  });

  it("asks which week for 'el próximo jueves' when that Thursday is still this week", () => {
    const r = parseEventText("Examen de Historia el próximo jueves a las 10:00", { now: NOW });
    expect(r.draft.date).toBeNull();
    expect(r.questions.find((q) => q.field === "date")?.options.map((o) => o.value)).toEqual(["2026-11-26", "2026-12-03"]);
  });

  it("asks for the day when only 'la semana que viene' is given", () => {
    const r = parseEventText("Entregar el trabajo de Física la semana que viene", { now: NOW });
    expect(r.draft.type).toBe("entrega");
    expect(r.draft.date).toBeNull();
    expect(r.questions.find((q) => q.field === "date")?.options[0]?.value).toBe("2026-11-30");
  });

  it("asks morning or afternoon for an unqualified 5 o'clock, and accepts 'de la tarde'", () => {
    const vague = parseEventText("Clase de Música el viernes a las 5", { now: NOW });
    expect(vague.draft.time).toBeNull();
    expect(vague.questions.find((q) => q.field === "time")?.options.map((o) => o.value)).toEqual(["05:00", "17:00"]);
    expect(parseEventText("Clase de Música el viernes a las 5 de la tarde", { now: NOW }).draft.time).toBe("17:00");
  });

  it("asks the type when the sentence does not say it", () => {
    const r = parseEventText("Matemáticas el viernes a las 10:00", { now: NOW });
    expect(r.draft.type).toBeNull();
    expect(r.questions.some((q) => q.field === "type")).toBe(true);
  });

  it("uses Madrid's calendar day, not UTC, for 'mañana'", () => {
    // 23:30 UTC on 28 March is already 00:30 on Sunday 29 March in Madrid
    const late = new Date("2026-03-28T23:30:00Z");
    expect(madridNow(late).date).toBe("2026-03-29");
    expect(parseEventText("Mañana estudiar Química a las 10:00", { now: late }).draft.date).toBe("2026-03-30");
  });

  it("rolls a past day-of-year to next year and reads time ranges", () => {
    expect(parseEventText("Examen de Latín el 10 de enero a las 9:00", { now: NOW }).draft.date).toBe("2027-01-10");
    const r = parseEventText("Clase de Dibujo el viernes de 16:00 a 18:00", { now: NOW });
    expect(r.draft).toMatchObject({ date: "2026-11-27", time: "16:00", endTime: "18:00", type: "clase" });
  });
});

describe("local agenda repository", () => {
  const input = { title: "Examen de Matemáticas", type: "examen" as const, subject: "Matemáticas", date: "2026-12-01", time: "09:00", endTime: null, notes: "" };

  it("keeps events after a reload and supports edit, complete and delete", async () => {
    const storage = memoryStorage();
    let n = 0;
    const repo = createLocalAgendaRepository(storage, { id: () => `id-${++n}`, now: () => NOW });
    const created = await repo.create(input);
    expect(created.source).toEqual({ kind: "web" });

    const reloaded = createLocalAgendaRepository(storage);
    expect((await reloaded.list()).map((e) => e.title)).toEqual(["Examen de Matemáticas"]);

    await reloaded.update(created.id, { time: "10:30", completed: true });
    expect((await repo.list())[0]).toMatchObject({ time: "10:30", completed: true });

    await repo.remove(created.id);
    expect(await reloaded.list()).toEqual([]);
  });

  it("imports events from the earlier agenda once", async () => {
    const storage = memoryStorage();
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ events: [{ id: "a", title: "Entrega", type: "Entrega", subject: "Física", date: "2026-11-30", start: "", end: "", notes: "", done: false }] }));
    const repo = createLocalAgendaRepository(storage);
    expect(await repo.list()).toMatchObject([{ id: "a", type: "entrega", subject: "Física", time: null }]);
    expect(storage.data.has(AGENDA_STORAGE_KEY)).toBe(true);
  });
});

describe("agenda warnings", () => {
  const base: Omit<AgendaEvent, "id" | "type" | "date"> = { title: "x", subject: null, time: null, endTime: null, notes: "", completed: false, source: { kind: "web" }, createdAt: "", updatedAt: "" };
  const ev = (id: string, type: AgendaEvent["type"], date: string, completed = false): AgendaEvent => ({ ...base, id, type, date, completed });

  it("warns about pending exams and deadlines within 7 days and about overdue events", () => {
    const list = [
      ev("exam3", "examen", "2026-11-27"),
      ev("exam7", "examen", "2026-12-01"),
      ev("exam8", "examen", "2026-12-02"),
      ev("hw3", "deberes", "2026-11-27"),
      ev("due0", "entrega", "2026-11-24"),
      ev("late", "deberes", "2026-11-20"),
      ev("doneExam", "examen", "2026-11-25", true),
    ];
    expect(warnings(list, "2026-11-24").map((w) => [w.event.id, w.kind])).toEqual([
      ["late", "vencido"],
      ["due0", "proximo"],
      ["exam3", "proximo"],
      ["exam7", "proximo"],
    ]);
  });
});
