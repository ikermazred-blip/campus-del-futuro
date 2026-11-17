import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ASSISTANTS, type AssistantId } from "../assistants";
import { AssistantLink } from "./AssistantLink";

interface Props {
  onShowInCampus: (id: AssistantId) => void;
}

export function AssistantList({ onShowInCampus }: Props) {
  return (
    <section id="asistentes" aria-labelledby="asistentes-titulo" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Acceso directo</p>
      <h2 id="asistentes-titulo" className="mt-2 text-3xl font-semibold sm:text-4xl">
        Todos los asistentes
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Cada edificio del campus es un asistente. Ábrelo desde aquí o localízalo en el mapa 3D.
      </p>
      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ASSISTANTS.map((a) => (
          <li key={a.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-ink-foreground" aria-hidden>
                {a.number}
              </span>
              <h3 className="text-xl font-semibold leading-snug">{a.name}</h3>
            </div>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">{a.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <AssistantLink assistant={a} size="default" />
              <Button variant="outline" onClick={() => onShowInCampus(a.id)} aria-label={`Ver en el campus: ${a.name}`}>
                <MapPin aria-hidden /> Ver en el campus
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-sm text-muted-foreground">
        Los asistentes se abren en esta misma pestaña. Usa el botón Atrás del navegador para volver al campus.
      </p>
    </section>
  );
}
