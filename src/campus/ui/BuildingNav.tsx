import { useEffect, useState } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { ASSISTANTS, type AssistantId } from "../assistants";
import { cn } from "@/lib/utils";

interface Props {
  selectedId: AssistantId | null;
  onSelect: (id: AssistantId) => void;
  onHover: (id: AssistantId | null) => void;
}

/** Desktop list of buildings over the 3D view; collapsible so it never hides the campus. */
export function BuildingNav({ selectedId, onSelect, onHover }: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (window.innerWidth >= 1536) setOpen(true);
  }, []);

  return (
    <nav aria-label="Edificios del campus" className="glass-panel pointer-events-auto absolute left-6 top-28 z-10 hidden w-72 rounded-2xl p-2 lg:block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="lista-edificios"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Building2 className="size-4 text-primary" aria-hidden />
        <span className="flex-1">Edificios del campus</span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <ol id="lista-edificios" hidden={!open} className="mt-1 space-y-1">
        {ASSISTANTS.map((a) => {
          const active = a.id === selectedId;
          return (
            <li key={a.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(a.id)}
                onMouseEnter={() => onHover(a.id)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(a.id)}
                onBlur={() => onHover(null)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-ink text-ink-foreground" : "hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                  )}
                  aria-hidden
                >
                  {a.number}
                </span>
                <span>{a.name}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
