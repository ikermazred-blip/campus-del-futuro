import { useCallback, useState } from "react";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { List, Move3d, RotateCcw, X } from "lucide-react";
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

function Home() {
  const { asignatura } = Route.useSearch();
  const navigate = Route.useNavigate();
  const selected = getSubject(asignatura);
  const [hoveredId, setHoveredId] = useState<SubjectId | null>(null);
  const [resetKey, setResetKey] = useState(0);
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

      <StudentWorkspace initialTab="agenda" embedded />
      <AssistantList onShowInCampus={() => document.getElementById("campus")?.scrollIntoView({ behavior: "smooth" })} />

      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground">SCHOOL AI WORLD · Tu campus de asignaturas y estudio</footer>
    </main>
  );
}
