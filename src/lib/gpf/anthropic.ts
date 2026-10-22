import "server-only";

/**
 * Appel minimal à l'API Anthropic (sans SDK). Modèle le moins coûteux par
 * défaut. La clé ANTHROPIC_API_KEY reste côté serveur.
 */
export const MODELE_ECONOMIQUE = "claude-haiku-5-5";
export const MODELE_ASSISTANT = process.env.GPF_ASSISTANT_MODEL || "claude-haiku-5-5";

export const iaDisponible = () => Boolean(process.env.ANTHROPIC_API_KEY);

type Block = { type: "text"; text: string } | { type: "document"; source: { type: "base64"; media_type: string; data: string } } | Record<string, unknown>;
export type Message = { role: "user" | "assistant"; content: string | Block[] };

export async function appelClaude(opts: { system?: string; messages: Message[]; model?: string; maxTokens?: number; tools?: unknown[] }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("assistant_non_configure");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: opts.model ?? MODELE_ECONOMIQUE,
      max_tokens: opts.maxTokens ?? 4096,
      system: opts.system,
      messages: opts.messages,
      ...(opts.tools ? { tools: opts.tools } : {})
    })
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error?.message ?? `anthropic_${res.status}`);
  return data as { content: ({ type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> })[]; stop_reason: string };
}

/** Extrait le premier bloc JSON d'une réponse texte. */
export function extraireJson<T>(texte: string): T | null {
  const m = texte.match(/```(?:json)?\s*([\s\S]*?)```/) ?? texte.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]) as T;
  } catch {
    return null;
  }
}
