import "server-only";
import { headers } from "next/headers";
import { dayKey, hmac } from "./crypto";

/**
 * IP du client. Jamais stockée en clair.
 * On ne fait confiance qu'aux en-têtes posés par la plateforme (Vercel) ; à défaut,
 * on prend la DERNIÈRE entrée de X-Forwarded-For (ajoutée par le proxy le plus proche),
 * jamais la première, que le client peut falsifier.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const vercel = h.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]!.trim();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",").at(-1)!.trim();
  return "0.0.0.0";
}

/** Empreinte de l'IP, valable une journée (le sel change chaque jour). */
export async function ipFingerprint(): Promise<string> {
  return hmac(await clientIp(), `ip:${dayKey()}`);
}
