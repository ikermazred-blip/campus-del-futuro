export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatSession = { accessToken: string; refreshToken: string; expiresAt: number; email: string };
type TutorRequest = { agentId: string; mode: string; conversationId?: string; messages: ChatMessage[] };
type TutorResponse = { reply: string; conversationId: string };
type AuthResponse = { access_token: string; refresh_token: string; expires_in: number; user: { email?: string } };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SESSION_KEY = "saw-auth-session-v1";
export const isBackendConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function getChatSession(): ChatSession | null {
  try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) as ChatSession : null; } catch { return null; }
}
function saveSession(data: AuthResponse): ChatSession {
  const session = { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: Date.now() + data.expires_in * 1000, email: data.user?.email ?? "" };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session)); return session;
}
export async function signIn(email: string, password: string): Promise<ChatSession> {
  if (!isBackendConfigured) throw new Error("El servicio de cuentas todavía no está configurado.");
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY }, body: JSON.stringify({ email, password }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || data.message || "No se ha podido iniciar sesión.");
  return saveSession(data as AuthResponse);
}
export function signOut() { localStorage.removeItem(SESSION_KEY); }
async function validSession(): Promise<ChatSession> {
  let session = getChatSession();
  if (!session) throw new Error("Inicia sesión para usar el chat sincronizado.");
  if (session.expiresAt > Date.now() + 60_000) return session;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY }, body: JSON.stringify({ refresh_token: session.refreshToken }) });
  const data = await response.json();
  if (!response.ok) { signOut(); throw new Error("Tu sesión ha caducado. Inicia sesión de nuevo."); }
  session = saveSession(data as AuthResponse); return session;
}
export async function sendTutorMessage(payload: TutorRequest): Promise<TutorResponse> {
  if (!isBackendConfigured) throw new Error("El backend todavía no está configurado.");
  const session = await validSession();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, { method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.accessToken}` }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `El servicio de IA ha respondido con el error ${response.status}.`);
  if (!data.reply || !data.conversationId) throw new Error("El servicio ha devuelto una respuesta incompleta.");
  return data as TutorResponse;
}

export type StoredTutorConversation = { id: string; agentId: string; mode: string; title: string; updatedAt: string; messages: ChatMessage[] };
async function authorizedRequest(body: unknown) {
  if (!isBackendConfigured) throw new Error("El backend todavía no está configurado.");
  const session = await validSession();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.accessToken}` },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `El servicio ha respondido con el error ${response.status}.`);
  return data;
}
export async function listTutorConversations(agentId: string): Promise<StoredTutorConversation[]> {
  const data = await authorizedRequest({ action: "list", agentId });
  return data.conversations as StoredTutorConversation[];
}
export async function deleteTutorConversation(conversationId: string): Promise<void> {
  await authorizedRequest({ action: "delete", conversationId });
}
