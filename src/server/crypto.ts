import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function hmac(value: string, purpose: string): string {
  return createHmac("sha256", `${env().APP_SECRET}:${purpose}`).update(value).digest("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Jour UTC courant (AAAA-MM-JJ), sert de sel tournant pour les empreintes d'IP. */
export function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
