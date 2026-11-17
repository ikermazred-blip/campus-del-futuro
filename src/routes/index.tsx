import { useCallback, useState } from "react";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { List, Move3d, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAssistant, isAssistantId, type AssistantId } from "@/campus/assistants";
import { CampusView } from "@/campus/CampusView";
import { AssistantList } from "@/campus/ui/AssistantList";
import { BuildingNav } from "@/campus/ui/BuildingNav";
import { DetailPanel } from "@/campus/ui/DetailPanel";

interface CampusSearch {
  edificio?: AssistantId;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): CampusSearch =>
    {
    const e = search["edificio"];
    return isAssistantId(e) ? { edificio: e } : {};
  },
  head: () => ({
    meta: [
      { title: "SCHOOL AI WORLD — Campus 3D de asistentes escolares" },
      {
        name: "description",
        content:
          "Recorre un campus escolar en 3D y entra en seis asistentes: profesor particular, planificador, preparador de exámenes, exposiciones orales, trabajos y orientación.",
      },
      { property: "og:title", content: "SCHOOL AI WORLD — Campus 3D de asistentes escolares" },
      {
        property: "og:description",
        content: "Selecciona un edificio del campus para entrar en tu asistente de estudio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { edificio } = Route.useSearch();
  const navigate = Route.useNavigate();
  const selectedId = edificio ?? null;
  const [hoveredId, setHoveredId] = useState<AssistantId | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const selected = getAssistant(selectedId);
  const hovered = getAssistant(hoveredId);

  const select = useCallback(
    (id: AssistantId | null) => {
      void navigate({ search: id ? { edificio: id } : {}, replace: true, resetScroll: false });
    },
    [navigate],
  );
  const onSelect = useCallback((id: AssistantId) => select(id), [select]);
  const onHover = useCallback((id: AssistantId | null) => setHoveredId(id), []);
  const close = useCallback(() => select(null), [select]);
  const overview = () => {
    select(null);
    setResetKey((k) => k + 1);
  };
  const showInCampus = (id: AssistantId) => {
    select(id);
    document.getElementById("campus")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main>
      <a
        href="#asistentes"
        className="sr-only z-50 rounded-md bg-ink px-4 py-2 text-ink-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Ir a la lista de asistentes
      </a>
      <section id="campus" aria-label="Campus 3D" className="relative h-[100svh] min-h-[520px] w-full overflow-hidden bg-sky">
        <ClientOnly fallback={null}>
          <CampusView selectedId={selectedId} hoveredId={hoveredId} resetKey={resetKey} onSelect={onSelect} onHover={onHover} />
        </ClientOnly>

        <header className="scene-fade-top pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pb-10 pt-4 sm:px-6 sm:pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="glass-panel pointer-events-auto rounded-2xl px-4 py-3 sm:px-5">
              <h1 className="text-xl font-semibold tracking-[0.06em] sm:text-2xl">SCHOOL AI WORLD</h1>
              <p className="text-sm text-muted-foreground sm:text-base">Selecciona un edificio para entrar</p>
            </div>
            <div className="pointer-events-auto flex flex-col gap-2 sm:flex-row">
              <Button variant="glass" onClick={overview} aria-label="Volver a la vista general del campus">
                <RotateCcw aria-hidden /> <span className="hidden sm:inline">Vista general</span>
              </Button>
              <Button variant="glass" asChild>
                <a href="#asistentes" aria-label="Ver la lista de asistentes">
                  <List aria-hidden /> <span className="hidden sm:inline">Lista de asistentes</span>
                </a>
              </Button>
            </div>
          </div>
        </header>

        <BuildingNav selectedId={selectedId} onSelect={onSelect} onHover={onHover} />

        {!selected && (
          <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center px-4" aria-hidden>
            <div className="glass-panel flex items-center gap-2 rounded-full px-4 py-2 text-sm">
              <Move3d className="size-4 text-primary" />
              {hovered ? (
                <span>
                  <strong>{hovered.name}</strong> · haz clic para ver detalles
                </span>
              ) : (
                <span>Arrastra para girar · Rueda o pellizca para acercar</span>
              )}
            </div>
          </div>
        )}

        {selected && <DetailPanel assistant={selected} onClose={close} />}
      </section>

      <AssistantList onShowInCampus={showInCampus} />

      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground">SCHOOL AI WORLD · Campus de asistentes escolares</footer>
    </main>
  );
}
