/** Calendar-day maths in Europe/Madrid. Days are YYYY-MM-DD strings; arithmetic runs in UTC so DST never shifts a day. */
export const AGENDA_TIME_ZONE = "Europe/Madrid";

export const WEEKDAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"] as const;
export const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

/** Current day and time on the wall clock of Madrid. */
export function madridNow(now: Date = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: AGENDA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

function toUTC(key: string) {
  const [y = 1970, m = 1, d = 1] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTC(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Builds a day key, or null when the day does not exist (e.g. 31 de febrero). */
export function dayKey(year: number, month: number, day: number): string | null {
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return fromUTC(d);
}

export function addDays(key: string, days: number) {
  const d = toUTC(key);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUTC(d);
}

/** 0 = lunes … 6 = domingo */
export function weekdayIndex(key: string) {
  return (toUTC(key).getUTCDay() + 6) % 7;
}

export function mondayOf(key: string) {
  return addDays(key, -weekdayIndex(key));
}

export function weekOf(monday: string) {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function diffDays(from: string, to: string) {
  return Math.round((toUTC(to).getTime() - toUTC(from).getTime()) / 86_400_000);
}

export function yearOf(key: string) {
  return Number(key.slice(0, 4));
}

/** "martes, 1 de diciembre" */
export function formatDayLong(key: string, withYear = false) {
  const d = toUTC(key);
  const base = `${WEEKDAYS[weekdayIndex(key)]}, ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`;
  return withYear ? `${base} de ${d.getUTCFullYear()}` : base;
}

/** "1 dic" */
export function formatDayShort(key: string) {
  const d = toUTC(key);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]?.slice(0, 3)}`;
}

export function dayOfMonth(key: string) {
  return toUTC(key).getUTCDate();
}

/** "30 nov – 6 dic 2026" */
export function formatWeekRange(monday: string) {
  const sunday = addDays(monday, 6);
  return `${formatDayShort(monday)} – ${formatDayShort(sunday)} ${yearOf(sunday)}`;
}

/** Relative label: hoy, mañana, en 3 días, hace 2 días. */
export function relativeDay(today: string, key: string) {
  const n = diffDays(today, key);
  if (n === 0) return "hoy";
  if (n === 1) return "mañana";
  if (n === -1) return "ayer";
  return n > 0 ? `en ${n} días` : `hace ${-n} días`;
}
