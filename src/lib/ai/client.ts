export type ChatMessage = { role: "user" | "assistant"; content: string };

type TutorRequest = {
  agentId: string;
  mode: string;
  messages: ChatMessage[];
};

type TutorResponse = { reply: string; conversationId?: string };

const apiBase = import.meta.env.VITE_AI_API_URL?.replace(/\/$/, "");

export async function sendTutorMessage(payload: TutorRequest): Promise<TutorResponse> {
  if (!apiBase) throw new Error("No se ha configurado VITE_AI_API_URL.");
  const response = await fetch(`${apiBase}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `El servicio de IA ha respondido con el error ${response.status}.`);
  }
  const data = await response.json() as TutorResponse;
  if (!data.reply) throw new Error("El servicio ha devuelto una respuesta vacía.");
  return data;
}
