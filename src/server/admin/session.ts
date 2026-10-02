// Jeton de session admin : charge utile JSON (base64url) + signature HMAC.
// Contient l'id admin, l'expiration et une empreinte du hash de mot de passe
// (changer le mot de passe invalide toutes les sessions ouvertes).
import "server-only";
import { hmac, safeEqual, sha256 } from "../crypto";

export const SESSION_COOKIE = "sl_admin";
export const SESSION_TTL_SEC = 8 * 60 * 60;
const PURPOSE = "admin-session";

export interface SessionPayload {
  /** id de l'AdminUser */
  sub: string;
  /** expiration, en secondes epoch */
  exp: number;
  /** empreinte courte du hash de mot de passe */
  pwv: string;
}

export function passwordVersion(passwordHash: string): string {
  return sha256(passwordHash).slice(0, 16);
}

export function createSessionToken(adminId: string, passwordHash: string, nowMs = Date.now()): string {
  const payload: SessionPayload = {
    sub: adminId,
    exp: Math.floor(nowMs / 1000) + SESSION_TTL_SEC,
    pwv: passwordVersion(passwordHash),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body, PURPOSE)}`;
}

/** Signature et expiration seulement ; l'appelant vérifie ensuite `pwv` contre la base. */
export function verifySessionToken(token: string | undefined, nowMs = Date.now()): SessionPayload | null {
  if (!token || token.length > 1024) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot !== token.lastIndexOf(".")) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, hmac(body, PURPOSE))) return null;
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as SessionPayload).sub !== "string" ||
    typeof (payload as SessionPayload).exp !== "number" ||
    typeof (payload as SessionPayload).pwv !== "string"
  )
    return null;
  const p = payload as SessionPayload;
  if (p.exp * 1000 <= nowMs) return null;
  return p;
}
