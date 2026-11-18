import { useEffect, useMemo, useState } from "react";
import { Archive, ArrowUp, Bot, BookOpen, Check, Clock3, LogIn, LogOut, Plus, Search, Sparkles, Trash2, UserRound } from "lucide-react";
import { getChatSession, isBackendConfigured, sendTutorMessage, signIn, signOut, type ChatMessage, type ChatSession } from "@/lib/ai/client";

type Conversation = { id: string; remoteId?: string; title: string; agentId: string; messages: ChatMessage[]; updatedAt: string };
type Props = { agentId: string; title: string; mode: string; description: string };
const STORAGE_KEY = "school-ai-world-conversations-v2";
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
function readConversations(): Conversation[] { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) as Conversation[] : []; } catch { return []; } }

export function TutorChat({ agentId, title, mode, description }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [session, setSession] = useState<ChatSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [search, setSearch] = useState("");
  const configured = isBackendConfigured;

  useEffect(() => {
    const all = readConversations(); setConversations(all);
    const latest = all.filter((item) => item.agentId === agentId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (latest) setActiveId(latest.id);
    setSession(getChatSession()); setLoaded(true);
  }, [agentId]);
  useEffect(() => { if (loaded) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations)); } catch { /* storage quota */ } } }, [conversations, loaded]);

  const agentConversations = useMemo(() => conversations.filter((item) => item.agentId === agentId && item.title.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es"))).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [conversations, agentId, search]);
  const active = agentConversations.find((item) => item.id === activeId) ?? conversations.find((item) => item.id === activeId);
  const createConversation = () => {
    const next: Conversation = { id: makeId(), title: "Nueva conversación", agentId, messages: [], updatedAt: new Date().toISOString() };
    setConversations((items) => [next, ...items]); setActiveId(next.id); setServiceError("");
  };
  const updateConversation = (id: string, updater: (item: Conversation) => Conversation) => setConversations((items) => items.map((item) => item.id === id ? updater(item) : item));
  const send = async () => {
    const content = draft.trim(); if (!content || !active || sending) return;
    const userMessage: ChatMessage = { role: "user", content };
    const localMessages = [...active.messages, userMessage]; setDraft(""); setServiceError("");
    updateConversation(active.id, (item) => ({ ...item, title: item.messages.length === 0 ? content.slice(0, 54) : item.title, messages: localMessages, updatedAt: new Date().toISOString() }));
    if (!configured || !session) { setServiceError(configured ? "Inicia sesión para activar las respuestas de IA y sincronizar este chat." : "El historial local funciona. Para activar la IA y la sincronización falta configurar el servicio de cuentas y el backend."); return; }
    setSending(true);
    try {
      const response = await sendTutorMessage({ agentId, mode, conversationId: active.remoteId, messages: [userMessage] });
      updateConversation(active.id, (item) => ({ ...item, remoteId: response.conversationId, messages: [...item.messages, { role: "assistant", content: response.reply }], updatedAt: new Date().toISOString() }));
    } catch (error) { setServiceError(error instanceof Error ? error.message : "No se ha podido conectar con el servicio de IA."); }
    finally { setSending(false); }
  };
  const removeConversation = (id: string) => { setConversations((items) => items.filter((item) => item.id !== id)); if (activeId === id) setActiveId(""); };
  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAuthBusy(true); setServiceError("");
    try { const next = await signIn(email.trim(), password); setSession(next); setPassword(""); }
    catch (error) { setServiceError(error instanceof Error ? error.message : "No se ha podido iniciar sesión."); }
    finally { setAuthBusy(false); }
  };

  return (
    <section className="saw-chat mt-6 overflow-hidden rounded-[26px] border shadow-[0_24px_70px_-35px_rgba(22,54,43,.45)]" aria-label={`Chat de ${title}`}>
      <header className="saw-chat-header relative overflow-hidden px-5 py-5 text-white sm:px-7">
        <div className="pointer-events-none absolute -right-12 -top-24 size-64 rounded-full border border-white/10"/><div className="pointer-events-none absolute -right-2 -top-16 size-44 rounded-full border border-white/10"/>
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3"><div className="flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10"><Bot size={25}/></div><div>
            <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-100/75">SCHOOL AI · AULA DIGITAL</p><span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold">ASISTENTE IA</span></div>
            <h3 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{title}</h3><p className="mt-0.5 text-xs text-emerald-50/75">{mode} · Espacio de aprendizaje personal</p>
          </div></div>
          <div className="flex items-center gap-2">{configured && session ? <><span className="hidden items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs sm:inline-flex">{session.email}</span><button onClick={() => { signOut(); setSession(null); }} className="flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold hover:bg-white/10"><LogOut size={14}/>Salir</button></> : <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs">{configured ? "Acceso protegido" : "Modo de preparación"}</span>}
            <button onClick={createConversation} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-[#183d32] shadow-lg transition hover:-translate-y-0.5"><Plus size={15}/>Nuevo chat</button>
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center gap-2 text-[11px] text-emerald-50/70"><span className="inline-flex items-center gap-1.5"><Sparkles size={13}/> Explicaciones adaptadas a tu asignatura</span><span className="hidden text-white/30 sm:inline">•</span><span className="inline-flex items-center gap-1.5"><BookOpen size={13}/> Aprende paso a paso</span><span className="hidden text-white/30 sm:inline">•</span><span className="inline-flex items-center gap-1.5"><Check size={13}/> Historial recuperable</span></div>
      </header>
      <div className="saw-chat-body grid min-h-[590px] md:grid-cols-[245px_minmax(0,1fr)]">
        <aside className="saw-chat-sidebar flex flex-col border-b p-3 md:border-b-0 md:border-r md:p-4">
          <button onClick={createConversation} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-800/25 bg-white/65 px-3 py-3 text-sm font-bold text-[#214d3e] transition hover:border-emerald-700 hover:bg-white"><Plus size={16}/> Iniciar conversación</button>
          <div className="relative mt-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71867c]" size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar conversaciones" className="w-full rounded-xl border border-[#dce6df] bg-white/75 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#648b75]"/></div>
          <div className="mt-5 flex items-center justify-between px-1"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#70877a]">Recientes</p><span className="text-[10px] text-[#8a9a90]">{agentConversations.length}</span></div>
          <div className="mt-2 flex max-h-[250px] flex-col gap-1 overflow-y-auto md:max-h-none md:flex-1">
            {agentConversations.length === 0 && <p className="rounded-xl px-3 py-4 text-xs leading-relaxed text-[#829187]">Tus conversaciones aparecerán aquí para que puedas retomarlas.</p>}
            {agentConversations.map((item) => <div key={item.id} className={`group flex items-center gap-1 rounded-xl border px-2 py-1.5 transition ${active?.id === item.id ? "border-[#c5d8cb] bg-white shadow-sm" : "border-transparent hover:bg-white/60"}`}>
              <button onClick={() => { setActiveId(item.id); setServiceError(""); }} className="min-w-0 flex-1 px-1 py-1 text-left"><span className="block truncate text-xs font-bold text-[#344d40]">{item.title}</span><span className="mt-1 flex items-center gap-1 text-[10px] text-[#8a9a90]"><Clock3 size={10}/>{new Date(item.updatedAt).toLocaleDateString("es-ES")}</span></button>
              <button onClick={() => removeConversation(item.id)} title="Eliminar conversación" aria-label="Eliminar conversación" className="rounded-lg p-2 text-[#9aaba0] opacity-70 hover:bg-red-50 hover:text-red-600"><Trash2 size={13}/></button>
            </div>)}
          </div>
          <div className="mt-4 rounded-xl border border-[#d9e4dc] bg-white/55 p-3 text-[10px] leading-relaxed text-[#718278]"><div className="mb-1.5 flex items-center gap-1.5 font-bold text-[#4b6757]"><Archive size={12}/>{configured && session ? "Cuenta conectada" : "Guardado en este dispositivo"}</div>{configured && session ? "Las conversaciones nuevas se guardan en tu cuenta." : "Este historial permanece en este navegador. La sincronización se activará al conectar la cuenta."}</div>
        </aside>
        <div className="flex min-w-0 flex-col bg-[#fffefa]">
          <div className="flex items-center justify-between border-b border-[#edf0e9] px-5 py-3 sm:px-7"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#9aa69b]">Conversación activa</p><p className="mt-0.5 text-sm font-bold text-[#334c3e]">{active?.title ?? "Nueva sesión de aprendizaje"}</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf5ee] px-2.5 py-1 text-[10px] font-bold text-[#55725f]"><span className={`size-1.5 rounded-full ${configured && session ? "bg-emerald-500" : "bg-amber-500"}`}/>{configured && session ? "Conectado" : "Preparado"}</span></div>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
            {!active || active.messages.length === 0 ? <div className="mx-auto flex min-h-[330px] max-w-xl flex-col items-center justify-center text-center"><div className="relative mb-5"><div className="flex size-[76px] items-center justify-center rounded-[25px] bg-[#e8f1e9] text-[#315b46] shadow-inner"><Bot size={38}/></div><span className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full border-4 border-[#fffefa] bg-[#dca66d] text-white"><Sparkles size={12}/></span></div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a0aa9f]">Tu espacio de estudio</p><h4 className="mt-2 text-2xl font-bold tracking-tight text-[#294638]">¿En qué podemos avanzar?</h4><p className="mt-2 max-w-md text-sm leading-relaxed text-[#78877d]">{description}</p><div className="mt-6 grid w-full gap-2 text-left sm:grid-cols-2">{["Explícame un tema paso a paso","Prepárame ejercicios para practicar","Ayúdame a resolver una duda","Hazme preguntas tipo examen"].map((prompt) => <button key={prompt} onClick={() => { if (!active) createConversation(); setDraft(prompt); }} className="rounded-xl border border-[#e1e9e1] bg-white px-3 py-3 text-xs font-semibold text-[#526c5a] transition hover:-translate-y-0.5 hover:border-[#a9c3ae] hover:shadow-sm">{prompt}<span className="float-right text-[#a0b3a3]">↗</span></button>)}</div></div> : active.messages.map((message, index) => <div key={index} className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>{message.role === "assistant" && <span className="mb-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#e8f1e9] text-[#41664e]"><Bot size={17}/></span>}<div className={`max-w-[88%] whitespace-pre-wrap rounded-[19px] px-4 py-3 text-sm leading-relaxed shadow-sm ${message.role === "user" ? "rounded-br-md bg-[#254b3c] text-white" : "rounded-bl-md border border-[#e7ece5] bg-white text-[#405449]"}`}>{message.content}</div>{message.role === "user" && <span className="mb-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#f3e9dc] text-[#956b43]"><UserRound size={16}/></span>}</div>)}
            {sending && <div className="flex items-center gap-2 text-xs text-[#849388]"><span className="flex size-8 items-center justify-center rounded-xl bg-[#e8f1e9] text-[#41664e]"><Bot size={16}/></span>El tutor está preparando una respuesta…</div>}
          </div>
          {configured && !session && <form onSubmit={(event) => void handleSignIn(event)} className="mx-4 mb-3 rounded-2xl border border-[#e1e8df] bg-[#f6f8f3] p-4 sm:mx-7"><div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#355542]"><LogIn size={16}/> Accede a tu cuenta para activar la IA</div><div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Correo electrónico" className="min-w-0 rounded-xl border border-[#dce5dc] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#789b7e]"/><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" className="min-w-0 rounded-xl border border-[#dce5dc] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#789b7e]"/><button disabled={authBusy} className="rounded-xl bg-[#254b3c] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{authBusy ? "Accediendo…" : "Entrar"}</button></div><p className="mt-2 text-[10px] text-[#819084]">Las cuentas se habilitan desde la administración del servicio; no hay registro público abierto.</p></form>}
          {serviceError && <p role="status" className="mx-4 mb-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 sm:mx-7">{serviceError}</p>}
          <form className="border-t border-[#edf0e9] bg-white p-4 sm:px-7 sm:py-5" onSubmit={(event) => { event.preventDefault(); void send(); }}><div className="flex items-end gap-2 rounded-2xl border border-[#dce5dc] bg-[#fbfcf9] p-2 shadow-inner focus-within:border-[#9bb7a0] focus-within:ring-4 focus-within:ring-[#dcebdd]/60"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={2} placeholder="Escribe tu pregunta aquí…" className="max-h-36 min-h-12 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-[#344d40] outline-none placeholder:text-[#a0aca2]"/><button type="submit" disabled={!draft.trim() || sending || !active} aria-label="Enviar mensaje" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#254b3c] text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#1c3e31] disabled:opacity-35"><ArrowUp size={19}/></button></div><div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-[#9aa69b]"><span>Intro para enviar · Mayús + Intro para nueva línea</span><span>Comprueba siempre la información importante.</span></div></form>
        </div>
      </div>
    </section>
  );
}
