// Hachage des mots de passe admin : scrypt (node:crypto), sel aléatoire,
// comparaison en temps constant. Sans "server-only" : utilisé aussi par
// scripts/create-admin.ts.
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

const PARAMS = { N: 32768, r: 8, p: 1 };
const KEY_LEN = 64;
const SALT_LEN = 16;
// 128 * N * r = 32 Mio : on laisse de la marge au-dessus de la limite par défaut.
const MAXMEM = 96 * 1024 * 1024;

function scrypt(password: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password.normalize("NFKC"), salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

/** Format : scrypt$N$r$p$sel(base64)$hash(base64). */
export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12) throw new Error("Mot de passe trop court (12 caractères minimum)");
  const salt = randomBytes(SALT_LEN);
  const key = await scrypt(password, salt, KEY_LEN, { ...PARAMS, maxmem: MAXMEM });
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (![N, r, p].every((n) => Number.isInteger(n) && n > 0) || N > 1 << 20 || r > 32 || p > 16) return false;
  const salt = Buffer.from(parts[4]!, "base64");
  const expected = Buffer.from(parts[5]!, "base64");
  if (!salt.length || expected.length < 32) return false;
  try {
    const key = await scrypt(password, salt, expected.length, { N, r, p, maxmem: Math.max(MAXMEM, 256 * N * r) });
    return timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

/** Hash factice pour égaliser le temps de réponse quand l'identifiant n'existe pas. */
let dummy: Promise<string> | undefined;
export function dummyHash(): Promise<string> {
  dummy ??= hashPassword(randomBytes(18).toString("base64"));
  return dummy;
}

/** Mot de passe aléatoire lisible (24 caractères base64url ≈ 144 bits). */
export function generatePassword(): string {
  return randomBytes(18).toString("base64url");
}
