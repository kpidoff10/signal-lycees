import "server-only";
import { env } from "@/lib/env";

export const EMBEDDING_DIM = 1024;

/**
 * Embedding du texte d'un signalement (Voyage AI). Renvoie null si le service
 * n'est pas configuré ou échoue : la détection de doublons se replie alors sur
 * la similarité textuelle (pg_trgm).
 */
export async function embed(text: string, inputType: "document" | "query" = "document"): Promise<number[] | null> {
  const { VOYAGE_API_KEY: key, VOYAGE_MODEL: model } = env();
  if (!key) return null;
  try {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ input: [text], model, input_type: inputType, output_dimension: EMBEDDING_DIM }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { embedding?: number[] }[] };
    const v = json.data?.[0]?.embedding;
    return Array.isArray(v) && v.length === EMBEDDING_DIM && v.every((x) => typeof x === "number") ? v : null;
  } catch {
    return null;
  }
}

/** Littéral pgvector, uniquement à partir de nombres validés. */
export function toVectorLiteral(v: number[]): string {
  return `[${v.map((x) => (Number.isFinite(x) ? x : 0)).join(",")}]`;
}
