import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "https://ikermazred-blip.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
type Message = { role: "user" | "assistant"; content: string };
type Body = { action?: "list" | "delete"; agentId?: string; conversationId?: string; mode?: string; messages?: Message[] };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function systemPrompt(agentId: string, mode: string): string {
  const general: Record<string, string> = {
    "profesor-particular": "Eres Profesor particular de SCHOOL AI WORLD. Explica dudas generales con claridad, paso a paso y adapta el nivel a Bachillerato.",
    "planificador-estudios-tareas": "Eres Planificador de estudios y tareas. Ayuda a organizar deberes, horarios realistas, prioridades y descansos. No inventes fechas ni tareas.",
    "preparador-examenes": "Eres Preparador de exámenes. Crea repasos, preguntas y simulacros; corrige las respuestas explicando los errores.",
    "entrenador-exposiciones-orales": "Eres Entrenador de exposiciones orales. Ayuda con estructura, claridad, ritmo y práctica; ofrece feedback concreto y respetuoso.",
    "asistente-trabajos-proyectos": "Eres Asistente de trabajos y proyectos. Ayuda a planificar, investigar y estructurar entregables, diferenciando hechos comprobados de hipótesis.",
    "orientador-academico-profesional": "Eres Orientador académico y profesional. Expón opciones de forma equilibrada y anima a contrastar requisitos oficiales.",
  };
  const subject = agentId.replaceAll("-", " ");
  const base = general[agentId] ?? `Eres el tutor de ${subject} en SCHOOL AI WORLD. Enseña con rigor, ejemplos y ejercicios adecuados a Bachillerato.`;
  return `${base}\nModo de trabajo seleccionado: ${mode}. Ajusta el enfoque a ese modo sin dejar de enseñar. Responde en español salvo que el alumno pida otro idioma. No inventes el contenido de apuntes que no se hayan aportado. Prioriza que el alumno comprenda el procedimiento y no solo el resultado. Si falta información, pregunta de forma concreta.`;
}

async function callGemini(messages: Message[], prompt: string): Promise<string> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("Falta configurar GEMINI_API_KEY en los secretos del backend.");
  const contents = messages.map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] }));
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash"}:generateContent?key=${key}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: prompt }] }, contents, generationConfig: { temperature: 0.55, maxOutputTokens: 1800 } }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? "Error del proveedor Gemini.");
  return data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") ?? "";
}

async function callOpenAI(messages: Message[], prompt: string): Promise<string> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("Falta configurar OPENAI_API_KEY en los secretos del backend.");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini", messages: [{ role: "system", content: prompt }, ...messages], temperature: 0.55, max_tokens: 1800 }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? "Error del proveedor OpenAI.");
  return data.choices?.[0]?.message?.content ?? "";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);
  try {
    const authorization = request.headers.get("Authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) return json({ error: "Debes iniciar sesión." }, 401);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return json({ error: "Sesión no válida. Vuelve a iniciar sesión." }, 401);
    const body = await request.json() as Body;
    const db = createClient(supabaseUrl, serviceKey);

    if (body.action === "list") {
      if (!body.agentId) return json({ error: "Falta el identificador del asistente." }, 400);
      const { data: chats, error } = await db.from("chat_conversations").select("id,agent_id,agent_mode,title,updated_at").eq("user_id", user.id).eq("agent_id", body.agentId).order("updated_at", { ascending: false }).limit(50);
      if (error) throw new Error("No se ha podido recuperar el historial.");
      const ids = (chats ?? []).map((chat) => chat.id);
      const { data: messages } = ids.length ? await db.from("chat_messages").select("conversation_id,role,content,created_at").eq("user_id", user.id).in("conversation_id", ids).order("created_at", { ascending: true }) : { data: [] };
      return json({ conversations: (chats ?? []).map((chat) => ({ id: chat.id, agentId: chat.agent_id, mode: chat.agent_mode, title: chat.title, updatedAt: chat.updated_at, messages: (messages ?? []).filter((message) => message.conversation_id === chat.id).map((message) => ({ role: message.role, content: message.content })) })) });
    }

    if (body.action === "delete") {
      if (!body.conversationId) return json({ error: "Falta la conversación." }, 400);
      const { error } = await db.from("chat_conversations").delete().eq("id", body.conversationId).eq("user_id", user.id);
      if (error) throw new Error("No se ha podido eliminar la conversación.");
      return json({ deleted: true });
    }

    if (!body.agentId || !body.mode || !Array.isArray(body.messages) || body.messages.length !== 1) return json({ error: "Petición no válida." }, 400);
    const latest = body.messages[0];
    if (latest.role !== "user" || typeof latest.content !== "string" || !latest.content.trim() || latest.content.length > 8000) return json({ error: "El mensaje está vacío o supera el límite permitido." }, 400);

    let conversationId = body.conversationId;
    if (conversationId) {
      const { data: conversation, error } = await db.from("chat_conversations").select("id").eq("id", conversationId).eq("user_id", user.id).maybeSingle();
      if (error || !conversation) return json({ error: "No se encuentra esa conversación en tu cuenta." }, 404);
    } else {
      const { data, error } = await db.from("chat_conversations").insert({ user_id: user.id, agent_id: body.agentId, agent_mode: body.mode, title: latest.content.slice(0, 54) }).select("id").single();
      if (error || !data) throw new Error("No se ha podido crear la conversación.");
      conversationId = data.id;
    }
    const { data: prior, error: historyError } = await db.from("chat_messages").select("role,content").eq("conversation_id", conversationId).eq("user_id", user.id).order("created_at", { ascending: true }).limit(40);
    if (historyError) throw new Error("No se ha podido recuperar el historial.");
    const history = [...(prior ?? []), latest] as Message[];
    const provider = (Deno.env.get("AI_PROVIDER") ?? "gemini").toLowerCase();
    if (provider !== "gemini" && provider !== "openai") return json({ error: "Proveedor no soportado todavía. Configura gemini u openai." }, 400);
    const prompt = systemPrompt(body.agentId, body.mode);
    const reply = provider === "openai" ? await callOpenAI(history, prompt) : await callGemini(history, prompt);
    if (!reply.trim()) throw new Error("El proveedor no ha devuelto una respuesta.");
    const { error: insertError } = await db.from("chat_messages").insert([
      { conversation_id: conversationId, user_id: user.id, role: "user", content: latest.content },
      { conversation_id: conversationId, user_id: user.id, role: "assistant", content: reply },
    ]);
    if (insertError) throw new Error("No se ha podido guardar la respuesta.");
    await db.from("chat_conversations").update({ updated_at: new Date().toISOString(), title: latest.content.slice(0, 54) }).eq("id", conversationId).eq("user_id", user.id);
    return json({ reply, conversationId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno.";
    return json({ error: message }, 500);
  }
});
