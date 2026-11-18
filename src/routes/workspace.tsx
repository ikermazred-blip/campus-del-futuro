import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentWorkspace } from "@/campus/StudentWorkspace";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Mi espacio de estudio — SCHOOL AI WORLD" },
      { name: "description", content: "Gestiona asignaturas, agenda, biblioteca y progreso académico." },
    ],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link to="/" className="text-lg font-bold tracking-wide">SCHOOL AI WORLD</Link>
          <Button asChild variant="outline" size="sm"><Link to="/"><ArrowLeft size={16}/> Volver al campus</Link></Button>
        </div>
      </header>
      <StudentWorkspace />
    </main>
  );
}
