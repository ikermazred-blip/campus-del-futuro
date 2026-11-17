import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssistantId } from "./assistants";

interface Props {
  selectedId: AssistantId | null;
  hoveredId: AssistantId | null;
  resetKey: number;
  onSelect: (id: AssistantId) => void;
  onHover: (id: AssistantId | null) => void;
}

type Status = "checking" | "loading" | "ready" | "unsupported" | "error";

const SLOW_MS = 15000;

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

class SceneBoundary extends Component<{ onError: (m: string) => void; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    this.props.onError(error instanceof Error ? error.message : String(error));
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Client-only 3D campus with WebGL detection, loading timeout, error fallback and retry. */
export function CampusView({ selectedId, hoveredId, resetKey, onSelect, onHover }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Status>("checking");
  const [slow, setSlow] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);

  const Scene = useMemo(() => lazy(() => import("./CampusCanvas")), [attempt]);

  useEffect(() => {
    setSlow(false);
    setDetail(null);
    setStatus(hasWebGL() ? "loading" : "unsupported");
  }, [attempt]);

  useEffect(() => {
    if (status !== "loading") return;
    const t = window.setTimeout(() => setSlow(true), SLOW_MS);
    return () => window.clearTimeout(t);
  }, [status, attempt]);

  const retry = useCallback(() => {
    setStatus("checking");
    setAttempt((a) => a + 1);
  }, []);
  const onReady = useCallback(() => setStatus("ready"), []);
  const onFatal = useCallback((m: string) => {
    setDetail(m);
    setStatus("error");
  }, []);

  const showScene = status === "loading" || status === "ready";

  return (
    <div className="absolute inset-0" data-scene-ready={status === "ready" ? "true" : undefined}>
      {showScene && (
        <SceneBoundary key={attempt} onError={onFatal}>
          <Suspense fallback={null}>
            <Scene
              selectedId={selectedId}
              hoveredId={hoveredId}
              resetKey={resetKey}
              onSelect={onSelect}
              onHover={onHover}
              onReady={onReady}
              onFatal={onFatal}
            />
          </Suspense>
        </SceneBoundary>
      )}

      {(status === "checking" || status === "loading") && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky/60" role="status" aria-live="polite">
          <div className="glass-panel flex max-w-sm flex-col items-center gap-3 rounded-2xl px-6 py-5 text-center">
            <Loader2 className="size-6 animate-slow-spin text-primary" aria-hidden />
            <p className="font-semibold">Preparando el campus…</p>
            {slow && (
              <>
                <p className="text-sm text-muted-foreground">Está tardando más de lo habitual. Puedes reintentar o usar la lista de asistentes.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={retry} size="sm">
                    <RotateCcw aria-hidden /> Reintentar
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href="#asistentes">Ver la lista</a>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {(status === "error" || status === "unsupported") && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky/70 p-4" role="alert">
          <div className="glass-panel flex max-w-md flex-col items-center gap-3 rounded-2xl px-6 py-6 text-center">
            <AlertTriangle className="size-7 text-primary" aria-hidden />
            <h2 className="text-xl font-semibold">
              {status === "unsupported" ? "Tu navegador no puede mostrar el campus 3D" : "No se pudo cargar el campus 3D"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {status === "unsupported"
                ? "Este dispositivo no tiene WebGL activado. Puedes entrar a todos los asistentes desde la lista."
                : "Ha ocurrido un problema al dibujar la escena. Vuelve a intentarlo o usa la lista de asistentes."}
            </p>
            {detail && <p className="text-xs text-muted-foreground">Detalle: {detail}</p>}
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={retry}>
                <RotateCcw aria-hidden /> Reintentar
              </Button>
              <Button asChild variant="outline">
                <a href="#asistentes">Ver la lista de asistentes</a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
