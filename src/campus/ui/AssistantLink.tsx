import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { openAssistant, type Assistant } from "../assistants";

interface Props {
  assistant: Assistant;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  children?: ReactNode;
}

/** "Abrir asistente": same-tab navigation so the browser Back button returns to the campus. */
export function AssistantLink({ assistant, variant = "default", size = "xl", className, children }: Props) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a
        href={assistant.url}
        target="_self"
        aria-label={`Abrir asistente: ${assistant.name}`}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          openAssistant(assistant.url);
        }}
      >
        {children ?? "Abrir asistente"}
        <ArrowUpRight aria-hidden />
      </a>
    </Button>
  );
}
