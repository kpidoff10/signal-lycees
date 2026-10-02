// TOTP (RFC 6238) au-dessus de HOTP (RFC 4226), avec node:crypto uniquement.
// Sans "server-only" : utilisé aussi par scripts/create-admin.ts.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx === -1) throw new Error("Secret base32 invalide");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export type TotpAlgorithm = "sha1" | "sha256" | "sha512";

export interface TotpOptions {
  digits?: number;
  period?: number;
  algorithm?: TotpAlgorithm;
}

export function hotp(key: Buffer, counter: number, digits = 6, algorithm: TotpAlgorithm = "sha1"): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac(algorithm, key).update(msg).digest();
  const offset = mac[mac.length - 1]! & 0x0f;
  const bin =
    ((mac[offset]! & 0x7f) << 24) | (mac[offset + 1]! << 16) | (mac[offset + 2]! << 8) | mac[offset + 3]!;
  return String(bin % 10 ** digits).padStart(digits, "0");
}

export function totp(key: Buffer, timeSec: number, opts: TotpOptions = {}): string {
  const { digits = 6, period = 30, algorithm = "sha1" } = opts;
  return hotp(key, Math.floor(timeSec / period), digits, algorithm);
}

/** Vérifie un code à ±`window` pas de temps (dérive d'horloge du téléphone). */
export function verifyTotp(secretB32: string, code: string, nowMs = Date.now(), window = 1): boolean {
  const c = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return false;
  let key: Buffer;
  try {
    key = base32Decode(secretB32);
  } catch {
    return false;
  }
  if (!key.length) return false;
  const t = Math.floor(nowMs / 1000);
  let ok = false;
  for (let w = -window; w <= window; w++) {
    const expected = totp(key, t + w * 30);
    // Pas de sortie anticipée : temps constant quel que soit le pas qui correspond.
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(c))) ok = true;
  }
  return ok;
}

/** Comme verifyTotp, mais renvoie le pas (fenêtre de 30 s) correspondant, ou null. */
export function matchTotpStep(secretB32: string, code: string, nowMs = Date.now(), window = 1): number | null {
  const c = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return null;
  let key: Buffer;
  try {
    key = base32Decode(secretB32);
  } catch {
    return null;
  }
  if (!key.length) return null;
  const t = Math.floor(nowMs / 1000);
  let step: number | null = null;
  for (let w = -window; w <= window; w++) {
    const expected = totp(key, t + w * 30);
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(c))) step = Math.floor((t + w * 30) / 30);
  }
  return step;
}

/** Secret de 160 bits (recommandation RFC 4226), encodé en base32. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function otpauthUri(secretB32: string, account: string, issuer = "Signal Lycées"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret: secretB32, issuer, algorithm: "SHA1", digits: "6", period: "30" });
  return `otpauth://totp/${label}?${params.toString()}`;
}
