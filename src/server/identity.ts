import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hmac, safeEqual } from "./crypto";
import { clientIp, ipFingerprint } from "./request";
import { rateLimit } from "./rate-limit";
import { verifyTurnstile } from "./turnstile";

export const IDENTITY_COOKIE = "sl_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

function sign(id: string) {
  return `${id}.${hmac(id, "identity")}`;
}

export function verifySigned(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  return safeEqual(sig, hmac(id, "identity")) ? id : null;
}

export type ParticipantError = "captcha" | "rate_limited" | "banned";

export type Participant =
  | { ok: true; identityId: string; ipKey: string }
  | { ok: false; error: ParticipantError };

/** Identité anonyme existante, sans en créer. */
export async function currentIdentityId(): Promise<string | null> {
  const store = await cookies();
  return verifySigned(store.get(IDENTITY_COOKIE)?.value);
}

/**
 * Point d'entrée unique de toute action participative (dépôt, vote, résolu).
 * Crée l'identité anonyme au premier geste, après vérification Turnstile.
 * Aucune donnée nominative n'est collectée.
 */
export async function requireParticipant(
  turnstileToken?: string | null,
  opts: { captchaVerified?: boolean } = {},
): Promise<Participant> {
  const ipKey = await ipFingerprint();
  const existing = await currentIdentityId();

  if (existing) {
    const identity = await prisma.anonymousIdentity.findUnique({ where: { id: existing } });
    if (identity) {
      if (identity.banned) return { ok: false, error: "banned" };
      const now = new Date();
      if (now.getTime() - identity.lastSeen.getTime() > 3600_000) {
        await prisma.anonymousIdentity.update({ where: { id: identity.id }, data: { lastSeen: now } });
      }
      return { ok: true, identityId: identity.id, ipKey };
    }
  }

  const limit = await rateLimit("identity", ipKey);
  if (!limit.ok) return { ok: false, error: "rate_limited" };
  // Un jeton Turnstile ne sert qu'une fois : on ne le revérifie pas s'il vient de l'être.
  if (!opts.captchaVerified && !(await verifyTurnstile(turnstileToken, await clientIp()))) return { ok: false, error: "captcha" };

  const identity = await prisma.anonymousIdentity.create({ data: {} });
  const store = await cookies();
  store.set(IDENTITY_COOKIE, sign(identity.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return { ok: true, identityId: identity.id, ipKey };
}

export const PARTICIPANT_ERRORS: Record<ParticipantError, string> = {
  captcha: "La vérification anti-robot a échoué. Recharge la page et réessaie.",
  rate_limited: "Trop de tentatives en peu de temps. Réessaie un peu plus tard.",
  banned: "Cette action n'est plus possible depuis cet appareil.",
};
