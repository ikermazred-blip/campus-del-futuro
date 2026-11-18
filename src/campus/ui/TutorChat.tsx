import { useEffect, useMemo, useState } from "react";
import { Archive, MessageCircle, Plus, Send, Trash2 } from "lucide-react";
import { sendTutorMessage, type ChatMessage } from "@/lib/ai/client";

type Conversation = {
  id: string;
  title: string;
  agentId: string;
  messages: ChatMessage[];
  updatedAt: string;
};

type Props = { agentId: string; title: string; mode: string; description: string };

const STORAGE_KEY = "school-ai-world-conversations-v1";
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function readConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Conversation[] : [];
  } catch {
    return [];
  }
}

export function TutorChat({ agentId, title, mode, description }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const configured = Boolean(import.meta.env.VITE_AI_API_URL);

  useEffect(() => {
    const all = readConversations();
    setConversations(all);
    const latest = all.filter((item) => item.agentId === agentId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (latest) setActiveId(latest.id);
    setLoaded(true);
  }, [agentId]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations)); } catch { /* storage quota or private mode */ }
  }, [conversations, loaded]);

  const agentConversations = useMemo(
    () => conversations.filter((item) => item.agentId === agentId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [conversations, agentId],
  );
  const active = agentConversations.find((item) => item.id === activeId) ?? agentConversations[0];

  const createConversation = () => {
    const next: Conversation = {
      id: makeId(),
      title: "Nueva conversación",
      agentId,
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    setConversations((items) => [next, ...items]);
    setActiveId(next.id);
    setServiceError("");
  };

  const updateConversation = (id: string, updater: (item: Conversation) => Conversation) => {
    setConversations((items) => items.map((item) => item.id === id ? updater(item) : item));
  };

  const send = async () => {
    const content = draft.trim();
    if (!content || !active || sending) return;
    const userMessage: ChatMessage = { role: "user", content };
    const nextMessages = [...active.messages, userMessage];
    setDraft("");
    setServiceError("");
    updateConversation(active.id, (item) => ({
      ...item,
      title: item.messages.length === 0 ? content.slice(0, 52) : item.title,
      messages: nextMessages,
      updatedAt: new Date().toISOString(),
    }));
    if (!configured) {
      setServiceError("El historial ya se guarda en este navegador, pero el motor de IA todavía no está conectado. Falta desplegar el backend y configurar VITE_AI_API_URL.");
      return;
    }
    setSending(true);
    try {
      const response = await sendTutorMessage({ agentId, mode, messages: nextMessages });
      updateConversation(active.id, (item) => ({
        ...item,
        messages: [...item.messages, { role: "assistant", content: response.reply }],
        updatedAt: new Date().toISOString(),
      }));
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : "No se ha podido conectar con el servicio de IA.");
    } finally {
      setSending(false);
    }
  };

  const removeConversation = (id: string) => {
    setConversations((items) => items.filter((item) => item.id !== id));
    if (activeId === id) setActiveId("");
  };

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border bg-card shadow-sm" aria-label={`Chat de ${title}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageCircle size={20}/></span>
          <div><p className="font-semibold">{title}</p><p className="text-xs text-muted-foreground">{mode} · Chat privado del tutor</p></div>
        </div>
        <button onClick={createConversation} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus size={16}/>Nuevo chat</button>
      </div>
      <div className="grid min-h-[440px] md:grid-cols-[220px_1fr]">
        <aside className="border-b bg-muted/20 p-3 md:border-b-0 md:border-r">
          <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tus conversaciones</p>
          {agentConversations.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">Todavía no hay conversaciones guardadas.</p>}
          <div className="space-y-1">
            {agentConversations.map((item) => (
              <div key={item.id} className={`group flex items-center gap-1 rounded-lg ${active?.id === item.id ? "bg-primary/10" : "hover:bg-muted"}`}>
                <button onClick={() => { setActiveId(item.id); setServiceError(""); }} className="min-w-0 flex-1 px-2 py-2 text-left">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="text-[11px] text-muted-foreground">{new Date(item.updatedAt).toLocaleDateString("es-ES")}</span>
                </button>
                <button onClick={() => removeConversation(item.id)} title="Eliminar conversación" aria-label="Eliminar conversación" className="p-2 text-muted-foreground opacity-70 hover:text-destructive"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border bg-card p-2 text-[11px] leading-relaxed text-muted-foreground"><Archive size={14} className="mb-1"/>Los chats se guardan localmente en este navegador. La sincronización entre dispositivos llegará con las cuentas y la base de datos.</div>
        </aside>
        <div className="flex min-w-0 flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {!active ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center"><MessageCircle size={34} className="mb-3 text-primary"/><h4 className="font-semibold">Empieza una conversación</h4><p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p><button onClick={createConversation} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Crear primer chat</button></div>
            ) : active.messages.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center"><h4 className="font-semibold">¿Qué vamos a aprender hoy?</h4><p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p><p className="mt-3 text-xs text-muted-foreground">Tu conversación se guardará para que puedas retomarla otro día.</p></div>
            ) : active.messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{message.content}</div>
              </div>
            ))}
            {sending && <p className="text-sm text-muted-foreground">El tutor está preparando una respuesta…</p>}
          </div>
          {serviceError && <p role="status" className="mx-4 mb-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200">{serviceError}</p>}
          <form className="border-t p-3" onSubmit={(event) => { event.preventDefault(); void send(); }}>
            <div className="flex items-end gap-2">
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={2} placeholder="Escribe tu duda… (Intro para enviar)" className="min-h-12 flex-1 resize-y rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              <button type="submit" disabled={!draft.trim() || sending || !active} aria-label="Enviar mensaje" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"><Send size={17}/></button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">{configured ? "Conexión con IA configurada · No compartas datos personales sensibles." : "Modo de preparación · El historial funciona; falta conectar el backend de IA."}</p>
          </form>
        </div>
      </div>
    </section>
  );
}
