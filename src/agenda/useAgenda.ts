import { useCallback, useEffect, useState } from "react";
import { getAgendaRepository } from "./repository";
import type { AgendaEvent, AgendaPatch, NewAgendaEvent } from "./types";

/** Live view of the shared agenda. `events` is null until loaded in the browser. */
export function useAgenda() {
  const [events, setEvents] = useState<AgendaEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const repo = getAgendaRepository();
    const load = () => {
      repo
        .list()
        .then((list) => alive && setEvents(list))
        .catch(() => alive && setError("No se pudo leer la agenda guardada en este navegador."));
    };
    load();
    const unsubscribe = repo.subscribe(load);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const guard = useCallback(async <T,>(run: () => Promise<T>) => {
    try {
      setError(null);
      return await run();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el cambio en este navegador.");
      return null;
    }
  }, []);

  const create = useCallback((input: NewAgendaEvent) => guard(() => getAgendaRepository().create(input)), [guard]);
  const update = useCallback((id: string, patch: AgendaPatch) => guard(() => getAgendaRepository().update(id, patch)), [guard]);
  const remove = useCallback((id: string) => guard(() => getAgendaRepository().remove(id)), [guard]);

  return { events, error, create, update, remove };
}
