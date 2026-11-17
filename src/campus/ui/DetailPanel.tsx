import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Assistant } from "../assistants";
import { AssistantLink } from "./AssistantLink";

interface Props {
  assistant: Assistant;
  onClose: () => void;
}

export function DetailPanel({ assistant, onClose }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [assistant.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const titleId = `detalle-${assistant.id}`;
  return (
    <aside
      key={assistant.id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="glass-panel animate-panel-in pointer-events-auto absolute inset-x-3 bottom-3 z-20 rounded-2xl p-5 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[400px] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Edificio {assistant.number}</p>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar detalles" className="-mr-2 -mt-2">
          <X aria-hidden />
        </Button>
      </div>
      <h2 ref={headingRef} id={titleId} tabIndex={-1} className="mt-1 text-2xl font-semibold leading-tight outline-none sm:text-3xl">
        {assistant.name}
      </h2>
      <p className="mt-3 text-base text-muted-foreground">{assistant.description}</p>
      <AssistantLink assistant={assistant} className="mt-5 w-full" />
      <p className="mt-3 text-xs text-muted-foreground">
        Se abre en esta misma pestaña. Usa el botón Atrás del navegador para volver al campus.
      </p>
    </aside>
  );
}
