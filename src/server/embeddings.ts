import "server-only";
import { env } from "@/lib/env";

export const EMBEDDING_DIM = 1024;

/**
 * Embedding du texte d'un signalement (OpenAI text-embedding-3-small via la passerelle Vercel,
 * réduit à 1024 dimensions comme la colonne pgvector). Renvoie null si la passerelle n'est pas
 * joignable ou échoue : la détection de doublons se replie alors sur la similarité textuelle (pg_trgm).
 */
export async function embed(text: string): Promise<number[] | null> {
  const e = env();
  // Sur Vercel, le jeton OIDC arrive avec chaque requête : la passerelle est toujours joignable.
  if (!e.AI_GATEWAY_API_KEY && !e.VERCEL_OIDC_TOKEN && !process.env.VERCEL) return null;
  try {
    const { embed: embedValue } = await import("ai");
    const { embedding: v } = await embedValue({
      model: e.EMBEDDING_MODEL,
      value: text,
      providerOptions: { openai: { dimensions: EMBEDDING_DIM } },
      abortSignal: AbortSignal.timeout(5000),
      maxRetries: 1,
    });
    return Array.isArray(v) && v.length === EMBEDDING_DIM && v.every((x) => typeof x === "number") ? v : null;
  } catch (err) {
    console.error("embed", err instanceof Error ? err.message.slice(0, 200) : err);
    return null;
  }
}

/** Littéral pgvector, uniquement à partir de nombres validés. */
export function toVectorLiteral(v: number[]): string {
  return `[${v.map((x) => (Number.isFinite(x) ? x : 0)).join(",")}]`;
}
