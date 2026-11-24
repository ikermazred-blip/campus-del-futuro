/**
 * Spanish natural-language event parser (pure). Never invents a date: when the phrase is
 * ambiguous or incomplete it returns questions for the student to answer on screen.
 */
import { addDays, dayKey, formatDayLong, madridNow, mondayOf, weekdayIndex, MONTHS, WEEKDAYS } from "./dates";
import { EVENT_TYPE_LABEL, type EventType } from "./types";

export interface EventDraft {
  type: EventType | null;
  subject: string | null;
  date: string | null;
  time: string | null;
  endTime: string | null;
  title: string;
  notes: string;
}

export type QuestionField = "type" | "date" | "time";

export interface ParseQuestion {
  field: QuestionField;
  prompt: string;
  options: Array<{ label: string; value: string }>;
}

export interface ParseResult {
  draft: EventDraft;
  questions: ParseQuestion[];
  /** What was understood, in plain Spanish, to show next to the preview */
  understood: string[];
}

const strip = (s: string) => s.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const pad = (n: number) => String(n).padStart(2, "0");

const WEEKDAY_WORDS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const WEEKDAY_RE = new RegExp(`\\b(${WEEKDAY_WORDS.join("|")})\\b`);
const MONTH_WORDS = MONTHS.map((m) => strip(m));
const NUMBER_WORDS: Record<string, number> = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, quince: 15 };

const TYPE_PATTERNS: Array<[EventType, RegExp]> = [
  ["examen", /\b(examen|examenes|control|prueba|parcial|recuperacion|evaluacion)\b/],
  ["entrega", /\b(entrega|entregar|entregas|fecha limite|plazo)\b/],
  ["deberes", /\b(deberes|tarea|tareas|ejercicios|actividades)\b/],
  ["estudio", /\b(estudiar|estudio|repasar|repaso)\b/],
  ["clase", /\b(clase|clases|tutoria|laboratorio|practicas)\b/],
];

/** Subject names with accent-free aliases; longest aliases are matched first. */
export const KNOWN_SUBJECTS: Array<[string, string[]]> = [
  ["Física y Química", ["fisica y quimica"]],
  ["Dibujo Técnico", ["dibujo tecnico"]],
  ["Educación Física", ["educacion fisica", "gimnasia"]],
  ["Lengua y Literatura", ["lengua castellana", "lengua y literatura", "lengua", "literatura"]],
  ["Matemáticas", ["matematicas", "mates"]],
  ["Inglés", ["ingles"]],
  ["Francés", ["frances"]],
  ["Alemán", ["aleman"]],
  ["Física", ["fisica"]],
  ["Química", ["quimica"]],
  ["Biología", ["biologia"]],
  ["Geología", ["geologia"]],
  ["Historia", ["historia"]],
  ["Geografía", ["geografia"]],
  ["Filosofía", ["filosofia"]],
  ["Economía", ["economia"]],
  ["Tecnología", ["tecnologia"]],
  ["Informática", ["informatica"]],
  ["Dibujo", ["dibujo"]],
  ["Latín", ["latin"]],
  ["Griego", ["griego"]],
  ["Música", ["musica"]],
  ["Plástica", ["plastica"]],
  ["Religión", ["religion"]],
];

export function detectType(n: string): EventType | null {
  let best: { type: EventType; at: number } | null = null;
  for (const [type, re] of TYPE_PATTERNS) {
    const m = re.exec(n);
    if (m && (!best || m.index < best.at)) best = { type, at: m.index };
  }
  return best?.type ?? null;
}

export function detectSubject(original: string, extra: readonly string[] = []): string | null {
  const n = strip(original);
  const all: Array<[string, string[]]> = [...extra.map((s): [string, string[]] => [s, [strip(s)]]), ...KNOWN_SUBJECTS];
  const flat = all.flatMap(([name, aliases]) => aliases.map((a) => [name, a] as const)).sort((a, b) => b[1].length - a[1].length);
  for (const [name, alias] of flat) {
    if (new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(n)) return name;
  }
  // "examen de Robótica" → a capitalised word after "de" that is not a month or weekday
  const m = original.match(/\b(?:de|del)\s+([A-ZÁÉÍÓÚÑ][\p{L}]+(?:\s+[A-ZÁÉÍÓÚÑ][\p{L}]+)?)/u);
  if (m?.[1]) {
    const word = strip(m[1]);
    if (!MONTH_WORDS.includes(word) && !WEEKDAY_WORDS.includes(word)) return m[1];
  }
  return null;
}

function countWord(w: string) {
  return /^\d+$/.test(w) ? Number(w) : NUMBER_WORDS[w] ?? NaN;
}

interface DateOutcome {
  date: string | null;
  question?: ParseQuestion;
  note?: string;
}

function dateOption(key: string, prefix = "") {
  return { label: `${prefix}${formatDayLong(key)}`, value: key };
}

function nextWeekOptions(today: string): ParseQuestion["options"] {
  const monday = addDays(mondayOf(today), 7);
  return Array.from({ length: 7 }, (_, i) => dateOption(addDays(monday, i)));
}

function explicitDate(n: string, today: string): string | null | "invalid" {
  const year = Number(today.slice(0, 4));
  const resolve = (d: number, m: number, y?: number) => {
    const fullYear = y === undefined ? year : y < 100 ? 2000 + y : y;
    let key = dayKey(fullYear, m, d);
    if (!key) return "invalid" as const;
    if (y === undefined && key < today) key = dayKey(fullYear + 1, m, d) ?? key;
    return key;
  };
  const numeric = n.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (numeric) return resolve(Number(numeric[1]), Number(numeric[2]), numeric[3] ? Number(numeric[3]) : undefined);
  const worded = n.match(new RegExp(`\\b(\\d{1,2})\\s+de\\s+(${MONTH_WORDS.join("|")})(?:\\s+(?:de|del)\\s+(\\d{4}))?\\b`));
  if (worded) {
    const month = MONTH_WORDS.indexOf(worded[2] ?? "") + 1;
    return resolve(Number(worded[1]), month, worded[3] ? Number(worded[3]) : undefined);
  }
  return null;
}

export function detectDate(n: string, today: string): DateOutcome {
  const todayW = weekdayIndex(today);
  const monday = mondayOf(today);
  const wdMatch = n.match(WEEKDAY_RE);
  const wd = wdMatch ? WEEKDAY_WORDS.indexOf(wdMatch[1] ?? "") : -1;
  const nextWeek = /\b(semana que viene|semana proxima|proxima semana|siguiente semana)\b/.test(n);

  const explicit = explicitDate(n, today);
  if (explicit === "invalid") {
    return { date: null, question: { field: "date", prompt: "Esa fecha no existe en el calendario. ¿Qué día es?", options: [] } };
  }
  if (explicit) {
    if (wd >= 0 && weekdayIndex(explicit) !== wd) {
      return {
        date: null,
        question: {
          field: "date",
          prompt: `Esa fecha no cae en ${WEEKDAYS[wd]}. ¿Qué día es?`,
          options: [dateOption(explicit)],
        },
      };
    }
    return { date: explicit, note: `Fecha indicada: ${formatDayLong(explicit, true)}` };
  }

  if (/\b(hoy|esta tarde|esta noche|esta manana)\b/.test(n)) return { date: today, note: "«hoy»" };
  if (/\bpasado manana\b/.test(n)) return { date: addDays(today, 2), note: "«pasado mañana»" };
  if (/\bmanana\b/.test(n.replace(/\b(por|de|a) la manana\b/g, ""))) return { date: addDays(today, 1), note: "«mañana»" };

  const within = n.match(/\b(?:dentro de|en)\s+(\d+|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|quince)\s+(dias?|semanas?)\b/);
  if (within) {
    const amount = countWord(within[1] ?? "");
    if (Number.isFinite(amount)) {
      const days = within[2]?.startsWith("semana") ? amount * 7 : amount;
      return { date: addDays(today, days), note: `«${within[0]}»` };
    }
  }

  if (wd >= 0) {
    if (nextWeek) {
      const key = addDays(monday, 7 + wd);
      return { date: key, note: `«la semana que viene» + «${WEEKDAYS[wd]}»` };
    }
    const thisWeek = new RegExp(`\\b(esta semana|este ${WEEKDAY_WORDS[wd]})\\b`).test(n);
    if (thisWeek) {
      const key = addDays(monday, wd);
      if (key < today) {
        return {
          date: null,
          question: { field: "date", prompt: "Ese día de esta semana ya ha pasado. ¿Te refieres a la semana que viene?", options: [dateOption(addDays(key, 7))] },
        };
      }
      return { date: key, note: "«esta semana»" };
    }
    const nextOccurrence = addDays(today, ((wd - todayW + 7) % 7) || 7);
    const proximo = new RegExp(`\\b(proximo|siguiente) ${WEEKDAY_WORDS[wd]}\\b|\\b${WEEKDAY_WORDS[wd]} que viene\\b`).test(n);
    if (proximo && nextOccurrence < addDays(monday, 7)) {
      return {
        date: null,
        question: {
          field: "date",
          prompt: `«El próximo ${WEEKDAYS[wd]}» puede ser esta semana o la siguiente. ¿Cuál es?`,
          options: [dateOption(nextOccurrence, "Esta semana: "), dateOption(addDays(nextOccurrence, 7), "La semana que viene: ")],
        },
      };
    }
    if (wd === todayW) {
      return {
        date: null,
        question: {
          field: "date",
          prompt: `Hoy ya es ${WEEKDAYS[wd]}. ¿Es hoy o el de la semana que viene?`,
          options: [dateOption(today, "Hoy: "), dateOption(addDays(today, 7), "La semana que viene: ")],
        },
      };
    }
    return { date: nextOccurrence, note: `próximo ${WEEKDAYS[wd]}` };
  }

  if (nextWeek) {
    return { date: null, question: { field: "date", prompt: "¿Qué día de la semana que viene?", options: nextWeekOptions(today) } };
  }
  if (/\bfin de semana\b/.test(n)) {
    const sat = addDays(today, ((5 - todayW + 7) % 7) || 7);
    return { date: null, question: { field: "date", prompt: "¿Sábado o domingo?", options: [dateOption(sat), dateOption(addDays(sat, 1))] } };
  }
  return {
    date: null,
    question: { field: "date", prompt: "No he encontrado el día. ¿Qué día es?", options: [dateOption(today, "Hoy: "), dateOption(addDays(today, 1), "Mañana: ")] },
  };
}

interface TimeOutcome {
  time: string | null;
  endTime: string | null;
  question?: ParseQuestion;
}

function clock(hRaw: string | undefined, mRaw: string | undefined, extra: string | undefined, meridiem: string | undefined) {
  let h = Number(hRaw);
  let m = mRaw ? Number(mRaw) : 0;
  if (extra?.includes("media")) m = 30;
  else if (extra?.includes("y cuarto")) m = 15;
  else if (extra?.includes("menos cuarto")) {
    h -= 1;
    m = 45;
  }
  const pm = meridiem ? /tarde|noche|pm/.test(meridiem) : false;
  if (pm && h < 12) h += 12;
  if (h > 23 || m > 59 || h < 0) return null;
  return { h, m, qualified: Boolean(meridiem) };
}

const HOUR = String.raw`(\d{1,2})(?:[:.h](\d{2}))?(\s+y\s+media|\s+y\s+cuarto|\s+menos\s+cuarto)?\s*(?:h\b|horas\b)?(\s*(?:de|por) la (?:manana|tarde|noche)|\s*(?:am|pm)\b)?`;

export function detectTime(n: string): TimeOutcome {
  if (/\bmediodia\b/.test(n)) return { time: "12:00", endTime: null };
  const range = n.match(new RegExp(String.raw`\b(?:de|entre las|desde las)\s+(?:las\s+)?${HOUR}\s+(?:a|y|hasta)\s+(?:las\s+)?${HOUR}`));
  let start: ReturnType<typeof clock> = null;
  let end: ReturnType<typeof clock> = null;
  if (range) {
    end = clock(range[5], range[6], range[7], range[8] ?? range[4]);
    start = clock(range[1], range[2], range[3], range[4] ?? range[8]);
  } else {
    const at = n.match(new RegExp(String.raw`\b(?:a las|a la|sobre las|para las|desde las)\s+${HOUR}`))
      ?? n.match(/\b(\d{1,2}):(\d{2})\b()()/)
      ?? n.match(/\b(\d{1,2})\s*h\b()()()/);
    if (at) start = clock(at[1], at[2] || undefined, at[3] || undefined, at[4] || undefined);
    const until = n.match(new RegExp(String.raw`\bhasta las\s+${HOUR}`));
    if (until) end = clock(until[1], until[2], until[3], until[4]);
  }
  const fmt = (c: NonNullable<typeof start>) => `${pad(c.h)}:${pad(c.m)}`;
  const endTime = end ? fmt(end) : null;
  if (!start) {
    return {
      time: null,
      endTime,
      question: { field: "time", prompt: "¿A qué hora es?", options: [{ label: "Sin hora concreta (todo el día)", value: "" }] },
    };
  }
  if (!start.qualified && start.h >= 1 && start.h <= 7) {
    return {
      time: null,
      endTime,
      question: {
        field: "time",
        prompt: `¿Las ${start.h} de la mañana o de la tarde?`,
        options: [
          { label: `${pad(start.h)}:${pad(start.m)} (mañana)`, value: `${pad(start.h)}:${pad(start.m)}` },
          { label: `${pad(start.h + 12)}:${pad(start.m)} (tarde)`, value: `${pad(start.h + 12)}:${pad(start.m)}` },
        ],
      },
    };
  }
  return { time: fmt(start), endTime };
}

export function buildTitle(type: EventType | null, subject: string | null, fallback: string) {
  if (!type) return fallback.trim().slice(0, 80);
  return subject ? `${EVENT_TYPE_LABEL[type]} de ${subject}` : EVENT_TYPE_LABEL[type];
}

/** Parse a sentence such as "La semana que viene tengo un examen el martes a las 9:00 de Matemáticas". */
export function parseEventText(text: string, opts: { now?: Date; subjects?: readonly string[] } = {}): ParseResult {
  const today = madridNow(opts.now).date;
  const n = strip(text).replace(/\s+/g, " ").trim();
  const type = detectType(n);
  const subject = detectSubject(text, opts.subjects ?? []);
  const date = detectDate(n, today);
  const time = detectTime(n);

  const questions: ParseQuestion[] = [];
  if (!type) {
    questions.push({
      field: "type",
      prompt: "¿Qué tipo de evento es?",
      options: (Object.keys(EVENT_TYPE_LABEL) as EventType[]).map((t) => ({ label: EVENT_TYPE_LABEL[t], value: t })),
    });
  }
  if (date.question) questions.push(date.question);
  if (time.question) questions.push(time.question);

  const understood: string[] = [];
  if (type) understood.push(`Tipo: ${EVENT_TYPE_LABEL[type]}`);
  if (subject) understood.push(`Asignatura: ${subject}`);
  if (date.date) understood.push(`Fecha: ${formatDayLong(date.date, true)}${date.note ? ` (${date.note})` : ""}`);
  if (time.time) understood.push(`Hora: ${time.time}${time.endTime ? `–${time.endTime}` : ""}`);

  return {
    draft: {
      type,
      subject,
      date: date.date,
      time: time.time,
      endTime: time.endTime,
      title: buildTitle(type, subject, text),
      notes: "",
    },
    questions,
    understood,
  };
}
