import { useEffect, useMemo, useRef, useState } from "react";
import { SUBJECTS, type SubjectId } from "./subjects";
import { TUTOR_MODES } from "./subjectTutors";
import { TutorChat } from "./ui/TutorChat";
import { BookOpen, CalendarDays, ChartNoAxesCombined, FileText, Plus, Trash2, GraduationCap } from "lucide-react";

type Tab = "subjects" | "agenda" | "progress" | "library";
type Tutor = "Profesor particular" | "Entrenador de ejercicios" | "Preparador de exámenes" | "Experto en apuntes";
type Subject = { id: string; name: string; };
type EventItem = { id: string; title: string; subject: string; type: string; date: string; start: string; end: string; notes: string; done: boolean; };
type StudyRecord = { id: string; subject: string; topic: string; status: "estudiado" | "pendiente"; score?: number; createdAt: string; };
type DocumentItem = { id: string; name: string; subject: string; type: string; size: number; createdAt: string; };

const DEFAULT_SUBJECTS = ["Matemáticas", "Física", "Química", "Lengua Castellana y Literatura", "Historia", "Filosofía", "Inglés", "Francés", "Dibujo Técnico", "Biología", "Tecnología e Ingeniería", "Economía"];
const TUTORS: Tutor[] = ["Profesor particular", "Entrenador de ejercicios", "Preparador de exámenes", "Experto en apuntes"];
const STORAGE_KEY = "school-ai-world-v1";

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as { subjects: Subject[]; events: EventItem[]; records: StudyRecord[]; docs: DocumentItem[] } : null;
  } catch { return null; }
}
function id() { return globalThis.crypto?.randomUUID?.() ?? String(Date.now()) + Math.random().toString(16).slice(2); }
function todayInMadrid() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return new Date(get("year"), get("month") - 1, get("day"));
}
function mondayOf(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
function dateKey(d: Date) { return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-"); }
function parseNatural(text: string, subjects: Subject[]): Omit<EventItem, "id" | "done"> | null {
  const lower = text.toLocaleLowerCase("es");
  const normalized = lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const days = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const dayIndex = days.findIndex((day) => normalized.includes(day));
  const startMatch = normalized.match(/\b(?:de|a las|sobre las|para las)\s*(\d{1,2})(?::(\d{2}))?\s*(?:h|horas)?\b/)
    ?? normalized.match(/\b(\d{1,2}):(\d{2})\b/)
    ?? normalized.match(/\b(\d{1,2})\s*(?:h|horas)\b/);
  if (dayIndex < 0 || !startMatch) return null;
  const hour = Number(startMatch[1]);
  const minute = Number(startMatch[2] ?? "0");
  if (hour > 23 || minute > 59) return null;
  const date = todayInMadrid();
  const delta = (dayIndex - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + delta);
  const start = String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
  const endMatch = normalized.match(/\b(?:hasta|a)\s*(\d{1,2})(?::(\d{2}))?\s*(?:h|horas)?\b/);
  const endHour = endMatch ? Number(endMatch[1]) : NaN;
  const endMinute = endMatch ? Number(endMatch[2] ?? "0") : 0;
  const end = endMatch && endHour <= 23 && endMinute <= 59
    ? String(endHour).padStart(2, "0") + ":" + String(endMinute).padStart(2, "0")
    : "";
  const subject = subjects.find((s) => normalized.includes(s.name.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
  const type = normalized.includes("examen") ? "Examen" : normalized.includes("entrega") ? "Entrega" : normalized.includes("clase") ? "Clase" : normalized.includes("estudi") ? "Estudio" : "Tarea";
  const title = text.trim().slice(0, 100);
  return { title: title || type, subject: subject?.name ?? "", type, date: dateKey(date), start, end, notes: "" };
}
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("school-ai-world-files", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function saveBlob(file: File, key: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put({ id: key, file });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
async function removeBlob(key: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
async function downloadBlob(key: string) {
  const db = await openDb();
  const file = await new Promise<File | undefined>((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const request = tx.objectStore("files").get(key);
    request.onsuccess = () => resolve(request.result?.file as File | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  if (file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url; a.download = file.name; a.click();
    URL.revokeObjectURL(url);
  }
}

interface StudentWorkspaceProps { initialTab?: Tab; embedded?: boolean; visibleSubjectIds?: SubjectId[]; }

export function StudentWorkspace({ initialTab = "subjects", embedded = false, visibleSubjectIds = SUBJECTS.map((subject) => subject.id) }: StudentWorkspaceProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS.map((name) => ({ id: name, name })));
  const [events, setEvents] = useState<EventItem[]>([]);
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(DEFAULT_SUBJECTS[0] ?? "Matemáticas");
  const [selectedTutor, setSelectedTutor] = useState<Tutor>("Profesor particular");
  const [topic, setTopic] = useState("");
  const [recordSubject, setRecordSubject] = useState(DEFAULT_SUBJECTS[0] ?? "Matemáticas");
  const [recordStatus, setRecordStatus] = useState<"estudiado" | "pendiente">("estudiado");
  const [score, setScore] = useState("");
  const [natural, setNatural] = useState("");
  const [preview, setPreview] = useState<Omit<EventItem, "id" | "done"> | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(dateKey(new Date()));
  const [eventTime, setEventTime] = useState("09:00");
  const [eventEnd, setEventEnd] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventSubject, setEventSubject] = useState(DEFAULT_SUBJECTS[0] ?? "Matemáticas");
  const [eventType, setEventType] = useState("Examen");
  const [fileSubject, setFileSubject] = useState(DEFAULT_SUBJECTS[0] ?? "Matemáticas");
  const [weekOffset, setWeekOffset] = useState(0);
  const [notice, setNotice] = useState("");
  const persistenceRef = useRef({ subjects, events, records, docs });
  persistenceRef.current = { subjects, events, records, docs };
  const visibleSubjects = useMemo(
    () => subjects.filter((item) => {
      const campusSubject = SUBJECTS.find((subject) => subject.name === item.name);
      return Boolean(campusSubject && visibleSubjectIds.includes(campusSubject.id));
    }),
    [subjects, visibleSubjectIds],
  );
  useEffect(() => {
    if (!visibleSubjects.length) return;
    const first = visibleSubjects[0].name;
    if (!visibleSubjects.some((item) => item.name === selectedSubject)) setSelectedSubject(first);
    if (!visibleSubjects.some((item) => item.name === recordSubject)) setRecordSubject(first);
    if (!visibleSubjects.some((item) => item.name === eventSubject)) setEventSubject(first);
    if (!visibleSubjects.some((item) => item.name === fileSubject)) setFileSubject(first);
  }, [visibleSubjects, selectedSubject, recordSubject, eventSubject, fileSubject]);

  useEffect(() => {
    const saved = readStore();
    if (saved) {
      if (saved.subjects?.length) setSubjects(saved.subjects);
      setEvents(saved.events ?? []); setRecords(saved.records ?? []); setDocs(saved.docs ?? []);
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify({ subjects, events, records, docs }));
  }, [loaded, subjects, events, records, docs]);
  useEffect(() => {
    if (!loaded) return;
    const persistBeforeExit = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persistenceRef.current));
      } catch {
        // Keep the current session usable if browser storage is unavailable or full.
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") persistBeforeExit();
    };
    window.addEventListener("pagehide", persistBeforeExit);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", persistBeforeExit);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loaded]);

  const weekStart = useMemo(() => {
    const d = mondayOf(todayInMadrid()); d.setDate(d.getDate() + weekOffset * 7); return d;
  }, [weekOffset]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }), [weekStart]);
  const sortedEvents = [...events].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const completed = records.filter((r) => r.status === "estudiado").length;
  const campusSubject = SUBJECTS.find((subject) => subject.name === selectedSubject);

  const addSubject = () => {
    const name = newSubject.trim();
    if (!name || subjects.some((s) => s.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"))) return;
    setSubjects((v) => [...v, { id: id(), name }]); setNewSubject("");
  };
  const addRecord = () => {
    if (!topic.trim()) return;
    setRecords((v) => [...v, { id: id(), subject: recordSubject, topic: topic.trim(), status: recordStatus, score: score ? Number(score) : undefined, createdAt: new Date().toISOString() }]);
    setTopic(""); setScore("");
  };
  const addEvent = (data: Omit<EventItem, "id" | "done">) => {
    if (!data.title.trim() || !data.date) return;
    setEvents((v) => [...v, { ...data, id: id(), done: false }]); setPreview(null); setEventTitle(""); setNotice("Evento guardado en esta instalación.");
  };
  const startEditingEvent = (event: EventItem) => {
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventDate(event.date);
    setEventTime(event.start || "09:00");
    setEventEnd(event.end || "");
    setEventType(event.type);
    setEventSubject(event.subject);
    setEventNotes(event.notes || "");
    setNotice("Editando evento. Modifica los campos y guarda los cambios.");
  };
  const saveManualEvent = () => {
    if (!eventTitle.trim() || !eventDate) return;
    const data = { title: eventTitle.trim(), subject: eventSubject, type: eventType, date: eventDate, start: eventTime, end: eventEnd, notes: eventNotes.trim() };
    if (editingEventId) {
      setEvents((items) => items.map((item) => item.id === editingEventId ? { ...item, ...data } : item));
      setNotice("Cambios del evento guardados.");
      setEditingEventId(null);
      setEventTitle("");
      setEventEnd("");
      setEventNotes("");
    } else {
      addEvent(data);
      setEventEnd("");
      setEventNotes("");
    }
  };
  const makePreview = () => {
    const result = parseNatural(natural, visibleSubjects);
    if (!result) { setNotice("No he podido identificar un día de la semana y una hora. Usa el formulario para introducirlos manualmente."); return; }
    setPreview(result); setNotice("Revisa los datos antes de confirmar. La fecha calculada es el próximo día indicado.");
  };
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const allowed = /\.(pdf|png|jpe?g|webp|docx?|pptx?|xlsx?)$/i;
    for (const file of Array.from(files)) {
      if (!allowed.test(file.name)) { setNotice("Tipo de archivo no admitido: " + file.name); continue; }
      if (file.size > 20 * 1024 * 1024) { setNotice("El archivo supera el límite de 20 MB: " + file.name); continue; }
      const key = id();
      try {
        await saveBlob(file, key);
        setDocs((v) => [...v, { id: key, name: file.name, subject: fileSubject, type: file.type || "Archivo", size: file.size, createdAt: new Date().toISOString() }]);
        setNotice("Archivo guardado en este navegador.");
      } catch { setNotice("No se pudo guardar el archivo. Comprueba el espacio disponible del navegador."); }
    }
  };

  return (
    <section id={embedded ? "agenda" : "espacio-estudio"} className={`mx-auto w-full max-w-7xl px-4 sm:px-6 ${embedded ? "py-8" : "py-12"}`}>
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Tu espacio académico</p><h2 className="mt-1 text-3xl font-semibold sm:text-4xl">Mi espacio de estudio</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Organiza asignaturas, agenda, materiales y progreso desde un único lugar.</p></div>
        <div className="rounded-xl border bg-card px-4 py-3 text-sm"><strong>{visibleSubjects.length}</strong> asignaturas · <strong>{events.filter(e => !e.done).length}</strong> eventos pendientes · <strong>{completed}</strong> temas estudiados</div>
      </div>
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Secciones académicas">
        {([{id:"subjects",label:"Mis asignaturas",icon:BookOpen},{id:"agenda",label:"Mi agenda",icon:CalendarDays},{id:"progress",label:"Mi progreso",icon:ChartNoAxesCombined},{id:"library",label:"Biblioteca",icon:FileText}] as const).map(({id: value,label,icon:Icon}) => <button key={value} onClick={() => setTab(value)} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${tab===value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`} aria-current={tab===value ? "page" : undefined}><Icon size={17}/>{label}</button>)}
      </nav>
      {notice && <div role="status" className="mb-4 rounded-lg border bg-card px-4 py-3 text-sm">{notice}</div>}

      {tab === "subjects" && <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border bg-card p-4"><h3 className="font-semibold">Asignaturas</h3><div className="mt-3 space-y-1">{visibleSubjects.map(s => <div key={s.id} className="flex gap-1"><button onClick={() => setSelectedSubject(s.name)} className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm ${selectedSubject===s.name ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"}`}>{s.name}</button><button aria-label={`Eliminar ${s.name}`} onClick={() => { const renamed = prompt("Nuevo nombre de la asignatura", s.name)?.trim(); if (renamed && renamed !== s.name && !subjects.some(x => x.id !== s.id && x.name.toLocaleLowerCase("es") === renamed.toLocaleLowerCase("es"))) { setSubjects(v => v.map(x => x.id === s.id ? { ...x, name: renamed } : x)); setEvents(v => v.map(x => x.subject === s.name ? { ...x, subject: renamed } : x)); setRecords(v => v.map(x => x.subject === s.name ? { ...x, subject: renamed } : x)); setDocs(v => v.map(x => x.subject === s.name ? { ...x, subject: renamed } : x)); if (selectedSubject === s.name) setSelectedSubject(renamed); } }} title="Renombrar asignatura" className="rounded-lg px-2 text-muted-foreground hover:bg-muted">✎</button><button aria-label={`Eliminar ${s.name}`} onClick={() => { if (confirm(`¿Eliminar la asignatura ${s.name}? Se conservarán los registros y archivos históricos.`)) setSubjects(v => v.filter(x => x.id!==s.id)); }} className="rounded-lg px-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={15}/></button></div>)}</div><div className="mt-4 flex gap-2"><input value={newSubject} onChange={e=>setNewSubject(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSubject()} placeholder="Nueva asignatura" className="min-w-0 w-full rounded-lg border bg-background px-3 py-2 text-sm"/><button onClick={addSubject} aria-label="Añadir asignatura" className="rounded-lg bg-primary px-3 text-primary-foreground"><Plus size={17}/></button></div></aside>
        <div className="rounded-2xl border bg-card p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Espacios de tutoría</p><h3 className="mt-1 text-2xl font-semibold">{selectedSubject}</h3></div><GraduationCap className="text-primary" size={30}/></div><div className="mt-4 flex flex-wrap gap-2">{TUTORS.map(t => <button key={t} onClick={()=>setSelectedTutor(t)} className={`rounded-lg border px-3 py-2 text-sm ${selectedTutor===t ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{t}</button>)}</div><div className="mt-5 rounded-xl bg-muted/50 p-4">
          <h4 className="font-semibold">{selectedTutor} · {selectedSubject}</h4>
          <p className="mt-2 text-sm text-muted-foreground">{TUTORS.includes(selectedTutor) ? TUTOR_MODES.find((mode) => mode.title === selectedTutor)?.description : ""}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {TUTOR_MODES.map((mode) => (
              <button key={mode.title} onClick={() => setSelectedTutor(mode.title as Tutor)} className={`rounded-xl border p-3 text-left transition ${selectedTutor === mode.title ? "border-primary bg-primary/10" : "bg-card hover:border-primary/50"}`}>
                <span className="block font-semibold">{mode.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{mode.description}</span>
              </button>
            ))}
          </div>
          <TutorChat
            agentId={campusSubject?.id ?? selectedSubject.toLocaleLowerCase("es").replace(/[^a-z0-9]+/g, "-")}
            title={`Tutor de ${selectedSubject}`}
            mode={selectedTutor}
            description={TUTOR_MODES.find((mode) => mode.title === selectedTutor)?.description ?? "Pregunta cualquier duda de esta asignatura."}
          />
        </div></div>
      </div>}

      {tab === "agenda" && <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border bg-card p-4 sm:p-5"><div className="mb-4 flex items-center justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Calendario semanal</p><h3 className="text-xl font-semibold">{weekStart.toLocaleDateString("es-ES",{month:"long",year:"numeric"})}</h3><p className="mt-1 text-xs text-muted-foreground">Guardado automático en este navegador</p></div><div className="flex gap-2"><button onClick={()=>setWeekOffset(v=>v-1)} className="rounded-lg border px-3 py-2" aria-label="Semana anterior">←</button><button onClick={()=>setWeekOffset(0)} className="rounded-lg border px-3 py-2 text-sm">Hoy</button><button onClick={()=>setWeekOffset(v=>v+1)} className="rounded-lg border px-3 py-2" aria-label="Semana siguiente">→</button></div></div><div className="grid grid-cols-7 gap-1">{weekDays.map(d=><div key={dateKey(d)} className="min-w-0 rounded-lg bg-muted/60 p-1.5 sm:p-2"><div className="text-center text-[10px] font-semibold uppercase sm:text-xs">{d.toLocaleDateString("es-ES",{weekday:"short"})}</div><div className="mb-2 text-center text-sm font-bold">{d.getDate()}</div><div className="space-y-1">{events.filter(e=>e.date===dateKey(d)).map(e=><div key={e.id} className={`rounded-md p-1 text-[9px] leading-tight sm:text-xs ${e.done?"bg-emerald-100 text-emerald-900 opacity-60":"bg-primary/10 text-foreground"}`}><div className="font-bold">{e.start||"—"}</div><div className="break-words">{e.title}</div><button onClick={()=>setEvents(v=>v.map(x=>x.id===e.id?{...x,done:!x.done}:x))} className="mt-1 underline">{e.done?"Reabrir":"Completar"}</button><button onClick={()=>startEditingEvent(e)} className="ml-1 underline">Editar</button><button onClick={()=>setEvents(v=>v.filter(x=>x.id!==e.id))} className="ml-1 underline">Borrar</button></div>)}</div></div>)}</div></div>
        <aside className="space-y-4"><div className="rounded-2xl border bg-card p-4"><h3 className="font-semibold">Añadir con lenguaje natural</h3><textarea value={natural} onChange={e=>setNatural(e.target.value)} rows={3} placeholder="El martes a las 9:00 tengo un examen de Matemáticas" className="mt-3 w-full rounded-lg border bg-background p-3 text-sm"/><button onClick={makePreview} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm font-semibold">Interpretar y revisar</button>{preview&&<div className="mt-3 rounded-lg bg-muted p-3 text-sm"><strong>Vista previa</strong><p>{preview.title}</p><p>{preview.type} · {preview.subject||"Sin asignatura"}</p><p>{preview.date} · {preview.start}</p><button onClick={()=>addEvent(preview)} className="mt-2 w-full rounded-lg bg-primary px-3 py-2 font-semibold text-primary-foreground">Confirmar y guardar</button></div>}</div>
        <div className="rounded-2xl border bg-card p-4"><h3 className="font-semibold">{editingEventId ? "Editar evento" : "Crear evento manual"}</h3><div className="mt-3 space-y-2"><input value={eventTitle} onChange={e=>setEventTitle(e.target.value)} placeholder="Título" className="w-full rounded-lg border bg-background px-3 py-2 text-sm"/><select value={eventType} onChange={e=>setEventType(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">{["Examen","Tarea","Entrega","Estudio","Clase","Otro"].map(x=><option key={x}>{x}</option>)}</select><select value={eventSubject} onChange={e=>setEventSubject(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm"><option value="">Sin asignatura</option>{visibleSubjects.map(s=><option key={s.id}>{s.name}</option>)}</select><input type="date" value={eventDate} onChange={e=>setEventDate(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm"/><input type="time" value={eventTime} onChange={e=>setEventTime(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm"/><label className="block text-xs text-muted-foreground">Hora de finalización (opcional)</label><input type="time" value={eventEnd} onChange={e=>setEventEnd(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm"/><textarea value={eventNotes} onChange={e=>setEventNotes(e.target.value)} rows={2} placeholder="Notas (opcional)" className="w-full rounded-lg border bg-background p-3 text-sm"/><button onClick={saveManualEvent} className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground">{editingEventId ? "Guardar cambios" : "Guardar evento"}</button>{editingEventId && <button onClick={()=>{setEditingEventId(null);setEventTitle("");setEventEnd("");setEventNotes("");}} className="w-full rounded-lg border px-3 py-2 text-sm">Cancelar edición</button>}</div></div></aside>
      </div>}

      {tab === "progress" && <div className="grid gap-5 lg:grid-cols-[320px_1fr]"><div className="rounded-2xl border bg-card p-5"><h3 className="font-semibold">Registrar aprendizaje</h3><p className="mt-1 text-sm text-muted-foreground">Añade temas reales que hayas estudiado o que tengas pendientes.</p><div className="mt-4 space-y-3"><select value={recordSubject} onChange={e=>setRecordSubject(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">{visibleSubjects.map(s=><option key={s.id}>{s.name}</option>)}</select><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Tema o contenido" className="w-full rounded-lg border bg-background px-3 py-2 text-sm"/><select value={recordStatus} onChange={e=>setRecordStatus(e.target.value as "estudiado"|"pendiente")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm"><option value="estudiado">Estudiado</option><option value="pendiente">Pendiente</option></select><input type="number" min="0" max="10" step="0.1" value={score} onChange={e=>setScore(e.target.value)} placeholder="Nota opcional (0–10)" className="w-full rounded-lg border bg-background px-3 py-2 text-sm"/><button onClick={addRecord} className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground">Guardar progreso</button></div></div><div className="rounded-2xl border bg-card p-5"><h3 className="font-semibold">Resumen académico</h3><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-xl bg-muted p-4"><div className="text-2xl font-bold">{completed}</div><div className="text-xs text-muted-foreground">Temas estudiados</div></div><div className="rounded-xl bg-muted p-4"><div className="text-2xl font-bold">{records.filter(r=>r.status==="pendiente").length}</div><div className="text-xs text-muted-foreground">Temas pendientes</div></div><div className="rounded-xl bg-muted p-4"><div className="text-2xl font-bold">{events.filter(e=>e.type==="Examen"&&!e.done).length}</div><div className="text-xs text-muted-foreground">Exámenes pendientes</div></div></div><div className="mt-5 space-y-2">{records.slice().reverse().map(r=><div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><div><strong>{r.subject}</strong><p className="text-muted-foreground">{r.topic} · {r.status}</p></div><div className="flex items-center gap-2">{r.score!==undefined&&<span className="font-bold">{r.score}/10</span>}<button aria-label="Eliminar registro" onClick={()=>setRecords(v=>v.filter(x=>x.id!==r.id))} className="text-muted-foreground hover:text-destructive"><Trash2 size={16}/></button></div></div>)}</div></div></div>}

      {tab === "library" && <div className="grid gap-5 lg:grid-cols-[320px_1fr]"><aside className="rounded-2xl border bg-card p-5"><h3 className="font-semibold">Añadir material</h3><p className="mt-1 text-sm text-muted-foreground">PDF, imágenes y documentos. Máximo 20 MB por archivo.</p><select value={fileSubject} onChange={e=>setFileSubject(e.target.value)} className="mt-4 w-full rounded-lg border bg-background px-3 py-2 text-sm">{visibleSubjects.map(s=><option key={s.id}>{s.name}</option>)}</select><label className="mt-3 block cursor-pointer rounded-xl border border-dashed p-5 text-center text-sm hover:bg-muted"><FileText className="mx-auto mb-2" size={24}/><span className="font-semibold">Seleccionar archivos</span><input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.ppt,.pptx,.xls,.xlsx" onChange={e=>void handleFiles(e.target.files)} className="sr-only"/></label><p className="mt-3 text-xs text-muted-foreground">Los archivos se guardan en el almacenamiento local de este navegador. No se suben a un servidor ni se sincronizan con otros dispositivos.</p></aside><div className="rounded-2xl border bg-card p-5"><h3 className="font-semibold">Material por asignatura</h3><div className="mt-4 space-y-2">{docs.map(d=><div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div className="min-w-0"><strong className="block break-all text-sm">{d.name}</strong><p className="text-xs text-muted-foreground">{d.subject} · {(d.size/1024/1024).toFixed(2)} MB</p></div><div className="flex gap-2"><button onClick={()=>void downloadBlob(d.id)} className="rounded-lg border px-3 py-2 text-xs">Descargar</button><button onClick={()=>{void removeBlob(d.id);setDocs(v=>v.filter(x=>x.id!==d.id));}} aria-label="Eliminar archivo" className="rounded-lg border px-3 py-2 text-xs text-destructive">Eliminar</button></div></div>)}{docs.length===0&&<p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">Todavía no has añadido documentos.</p>}</div></div></div>}
      <p className="mt-6 text-xs text-muted-foreground">Los datos de asignaturas, agenda y progreso se guardan en este navegador. No hay cuenta ni sincronización entre dispositivos configurada todavía. Zona horaria de referencia del proyecto: Europe/Madrid; las fechas se muestran según el calendario local del dispositivo.</p>
    </section>
  );
}
