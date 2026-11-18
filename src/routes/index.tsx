import { useCallback, useEffect, useState } from "react";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { GraduationCap, List, Move3d, RotateCcw, UserRoundPen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSubject, isSubjectId, type SubjectId } from "@/campus/subjects";
import { getSubjectTutor } from "@/campus/subjectTutors";
import { CampusView } from "@/campus/CampusView";
import { AssistantList } from "@/campus/ui/AssistantList";
import { StudentWorkspace } from "@/campus/StudentWorkspace";

interface CampusSearch {
  asignatura?: SubjectId;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): CampusSearch => {
    const subject = search["asignatura"];
    return isSubjectId(subject) ? { asignatura: subject } : {};
  },
  head: () => ({
    meta: [
      { title: "SCHOOL AI WORLD — Campus de asignaturas" },
      {
        name: "description",
        content: "Un campus escolar 3D con personajes para tus asignaturas y una agenda de estudio integrada.",
      },
      { property: "og:title", content: "SCHOOL AI WORLD — Campus de asignaturas" },
      {
        property: "og:description",
        content: "Selecciona un personaje para entrar en una asignatura y organiza tu semana desde la agenda principal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type StudentProfile = { modality: string; electives: string[]; updatedAt: string };

const PROFILE_KEY = "school-ai-world-student-profile-v1";
const MODALITIES = [
  "Bachillerato de Ciencias y Tecnología",
  "Bachillerato de Humanidades y Ciencias Sociales",
  "Bachillerato General",
  "Bachillerato de Artes",
];
const ELECTIVE_OPTIONS = [
  "Biología",
  "Dibujo Técnico",
  "Física",
  "Química",
  "Tecnología e Ingeniería",
  "Economía",
  "Latín",
  "Griego",
  "Matemáticas Aplicadas a las Ciencias Sociales",
  "Historia del Mundo Contemporáneo",
  "Literatura Universal",
  "Anatomía Aplicada",
  "Segunda Lengua Extranjera",
  "Cultura Audiovisual",
  "Técnicas de Expresión Gráfico-plástica",
  "Tecnologías de la Información y la Comunicación",
];

function Home() {
  const { asignatura } = Route.useSearch();
  const navigate = Route.useNavigate();
  const selected = getSubject(asignatura);
  const [hoveredId, setHoveredId] = useState<SubjectId | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showEntryReminder, setShowEntryReminder] = useState(false);
  const [draftModality, setDraftModality] = useState("");
  const [draftElectives, setDraftElectives] = useState<string[]>([]);
  const [customElective, setCustomElective] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as StudentProfile;
        if (saved.modality && Array.isArray(saved.electives)) {
          setProfile(saved);
          setDraftModality(saved.modality);
          setDraftElectives(saved.electives);
          setShowEntryReminder(true);
        } else {
          setProfileOpen(true);
        }
      } else {
        setProfileOpen(true);
      }
    } catch {
      setProfileOpen(true);
    }
    setProfileReady(true);
  }, []);
  const saveProfile = () => {
    if (!draftModality) return;
    const extra = customElective.trim();
    const next: StudentProfile = {
      modality: draftModality,
      electives: Array.from(new Set([...draftElectives, ...(extra ? [extra] : [])])),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    setProfile(next);
    setCustomElective("");
    setProfileOpen(false);
    setShowEntryReminder(true);
  };
  const toggleElective = (name: string) => {
    setDraftElectives((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  };
  const hovered = getSubject(hoveredId);

  const select = useCallback(
    (id: SubjectId | null) => {
      void navigate({ search: id ? { asignatura: id } : {}, replace: true, resetScroll: false });
    },
    [navigate],
  );
  const onSelect = useCallback((id: SubjectId) => select(id), [select]);
  const onHover = useCallback((id: SubjectId | null) => setHoveredId(id), []);
  const overview = () => {
    select(null);
    setResetKey((k) => k + 1);
  };

  return (
    <main>
      <a
        href="#agenda"
        className="sr-only z-50 rounded-md bg-ink px-4 py-2 text-ink-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Ir a la agenda
      </a>
      <section id="campus" aria-label="Campus 3D de asignaturas" className="relative h-[88svh] min-h-[600px] w-full overflow-hidden bg-sky">
        <ClientOnly fallback={null}>
          <CampusView selectedId={asignatura ?? null} hoveredId={hoveredId} resetKey={resetKey} onSelect={onSelect} onHover={onHover} />
        </ClientOnly>

        <header className="scene-fade-top pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pb-10 pt-4 sm:px-6 sm:pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="glass-panel pointer-events-auto rounded-2xl px-4 py-3 sm:px-5">
              <h1 className="text-xl font-semibold tracking-[0.06em] sm:text-2xl">SCHOOL AI WORLD</h1>
              <p className="text-sm text-muted-foreground sm:text-base">Elige una asignatura y entra con su personaje</p>
            </div>
            <div className="pointer-events-auto flex flex-col gap-2 sm:flex-row">
              <Button variant="glass" onClick={() => {
                setDraftModality(profile?.modality ?? "");
                setDraftElectives(profile?.electives ?? []);
                setProfileOpen(true);
              }}><UserRoundPen aria-hidden /> <span className="hidden sm:inline">Mi perfil</span></Button>
              <Button variant="glass" asChild><a href="#agenda">Mi agenda</a></Button>
              <Button variant="glass" onClick={overview} aria-label="Volver a la vista general del campus">
                <RotateCcw aria-hidden /> <span className="hidden sm:inline">Vista general</span>
              </Button>
              <Button variant="glass" asChild>
                <a href="#asistentes" aria-label="Ver asistentes generales">
                  <List aria-hidden /> <span className="hidden sm:inline">Asistentes generales</span>
                </a>
              </Button>
            </div>
          </div>
        </header>

        {profileReady && profile && showEntryReminder && (
          <div className="pointer-events-auto absolute left-1/2 top-24 z-20 w-[min(94%,620px)] -translate-x-1/2 rounded-2xl border border-white/30 bg-slate-950/80 px-4 py-3 text-white shadow-xl backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <GraduationCap className="mt-0.5 size-5 shrink-0 text-sky-300" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Tu perfil académico</p>
                <p className="mt-1 text-xs leading-relaxed text-white/85">{profile.modality}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/70">Optativas: {profile.electives.length ? profile.electives.join(" · ") : "No has indicado optativas"}</p>
              </div>
              <button type="button" onClick={() => setShowEntryReminder(false)} className="rounded-full p-1 text-white/80 hover:bg-white/15" aria-label="Cerrar recordatorio"><X size={17}/></button>
            </div>
          </div>
        )}

        {!selected && (
          <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center px-4" aria-hidden>
            <div className="glass-panel flex items-center gap-2 rounded-full px-4 py-2 text-sm">
              <Move3d className="size-4 text-primary" />
              {hovered ? (
                <span><strong>{hovered.name}</strong> · pulsa el personaje para entrar</span>
              ) : (
                <span>Arrastra para girar · Rueda o pellizca para acercar · Pulsa un personaje</span>
              )}
            </div>
          </div>
        )}

        {selected && (
          <div className="glass-panel pointer-events-auto absolute bottom-5 left-1/2 z-20 w-[min(92%,420px)] -translate-x-1/2 rounded-2xl p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Asignatura seleccionada</p>
                <h2 className="mt-1 text-xl font-semibold">{selected.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selected.description}</p>
              </div>
              <button type="button" onClick={() => select(null)} className="rounded-full p-2 hover:bg-muted" aria-label="Cerrar selección"><X size={18}/></button>
            </div>
            <div className="mt-3 grid gap-2">
              <Button asChild className="w-full">
                <a href={getSubjectTutor(selected.id).url} target="_blank" rel="noopener noreferrer">Abrir tutor de {selected.name}</a>
              </Button>
              <Button variant="outline" className="w-full" onClick={() => document.getElementById("agenda")?.scrollIntoView({ behavior: "smooth" })}>
                Ir a mi espacio de estudio
              </Button>
            </div>
          </div>
        )}
      </section>

      {profileReady && profileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="profile-title">
          <div className="my-auto w-full max-w-2xl rounded-3xl border bg-card p-5 shadow-2xl sm:p-8">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary"><GraduationCap className="size-7"/></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Configuración inicial</p>
                <h2 id="profile-title" className="mt-1 text-2xl font-semibold sm:text-3xl">Personaliza tu campus</h2>
                <p className="mt-2 text-sm text-muted-foreground">Cuéntanos qué Bachillerato estás cursando y qué optativas has elegido. Guardaremos estos datos en este navegador para recordarlos cuando vuelvas.</p>
              </div>
            </div>
            <div className="mt-6 space-y-6">
              <div>
                <label htmlFor="student-modality" className="mb-2 block text-sm font-semibold">¿Qué modalidad de Bachillerato has elegido?</label>
                <select id="student-modality" value={draftModality} onChange={(event) => setDraftModality(event.target.value)} className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Selecciona tu modalidad</option>
                  {MODALITIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <p className="mb-1 text-sm font-semibold">¿Qué optativas has elegido?</p>
                <p className="mb-3 text-xs text-muted-foreground">Puedes marcar varias. La oferta depende de tu centro; si alguna no aparece, añádela abajo.</p>
                <div className="grid max-h-52 gap-2 overflow-y-auto rounded-xl border bg-background p-3 sm:grid-cols-2">
                  {ELECTIVE_OPTIONS.map((item) => (
                    <label key={item} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                      <input type="checkbox" checked={draftElectives.includes(item)} onChange={() => toggleElective(item)} className="size-4 accent-primary"/>
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input value={customElective} onChange={(event) => setCustomElective(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && customElective.trim()) { event.preventDefault(); toggleElective(customElective.trim()); setCustomElective(""); } }} placeholder="Otra optativa de tu centro" className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"/>
                  <Button type="button" variant="outline" onClick={() => { const value = customElective.trim(); if (value) { toggleElective(value); setCustomElective(""); } }} disabled={!customElective.trim()}>Añadir optativa</Button>
                </div>
                {draftElectives.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Seleccionadas: {draftElectives.join(" · ")}</p>}
              </div>
            </div>
            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {profile && <Button type="button" variant="outline" onClick={() => setProfileOpen(false)}>Cancelar</Button>}
              <Button type="button" onClick={saveProfile} disabled={!draftModality}>Guardar mi perfil y entrar</Button>
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">Tus datos se guardan localmente en este navegador. No se envían a un servidor.</p>
          </div>
        </div>
      )}

      <StudentWorkspace initialTab="agenda" embedded />
      <AssistantList onShowInCampus={() => document.getElementById("campus")?.scrollIntoView({ behavior: "smooth" })} />

      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground">SCHOOL AI WORLD · Tu campus de asignaturas y estudio</footer>
    </main>
  );
}
