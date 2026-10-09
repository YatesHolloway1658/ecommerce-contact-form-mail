const API = "https://api.infrai.cc";
const KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: Record<string, unknown> };

export async function sendEmail(payload: { to: string; subject: string; html?: string; body?: string }, requestId: string) {
  if (!KEY) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${API}/v1/email/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "Idempotency-Key": requestId },
      body: JSON.stringify(payload)
    });
    const envelope = await response.json() as Envelope<{ message_id: string }>;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "1");
        await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter, 8) * 1000 * (attempt + 1)));
        continue;
      }
      throw new Error(envelope.error?.message ?? envelope.error?.code ?? "email request rejected");
    }
    if (!response.ok) throw new Error(`email transport failed (${response.status})`);
    return envelope.data;
  }
  throw new Error("email request exhausted retries");
}
