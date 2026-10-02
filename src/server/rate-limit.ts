import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

export type LimitName =
  | "search"
  | "map"
  | "identity"
  | "submit"
  | "submitIp"
  | "submitDaily"
  | "submitDailyIp"
  | "vote"
  | "voteIp"
  | "report"
  | "adminLogin"
  | "privacy";

// [nombre de requêtes, fenêtre en secondes]. Les limites par IP sont larges : dans un
// lycée, des centaines d'élèves partagent la même adresse IP (NAT du réseau).
// Les limites par identité anonyme sont strictes.
export const LIMITS: Record<LimitName, [number, number]> = {
  search: [120, 60], // par IP
  map: [300, 60], // par IP
  identity: [60, 3600], // nouvelles identités par IP
  submit: [3, 600], // par identité
  submitIp: [30, 600],
  submitDaily: [8, 86400], // par identité
  submitDailyIp: [200, 86400],
  vote: [40, 600], // par identité
  voteIp: [600, 600],
  report: [20, 3600], // par IP
  adminLogin: [5, 900], // par IP et par identifiant
  privacy: [5, 3600], // par IP
};

/** Multiplicateur réservé au développement et aux tests E2E (RATE_LIMIT_MULTIPLIER). */
function limitFor(name: LimitName): [number, number] {
  const [max, win] = LIMITS[name];
  const m = Number(process.env.RATE_LIMIT_MULTIPLIER ?? "1");
  const factor = process.env.NODE_ENV !== "production" && Number.isFinite(m) && m > 0 ? m : 1;
  return [Math.max(1, Math.round(max * factor)), win];
}

export interface LimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

interface Limiter {
  limit(name: LimitName, key: string): Promise<LimitResult>;
}

/** Repli en mémoire pour le développement (une instance, non partagé). */
export class MemoryLimiter implements Limiter {
  private hits = new Map<string, number[]>();

  async limit(name: LimitName, key: string, now = Date.now()): Promise<LimitResult> {
    const [max, windowSec] = limitFor(name);
    const k = `${name}:${key}`;
    const windowStart = now - windowSec * 1000;
    const list = (this.hits.get(k) ?? []).filter((t) => t > windowStart);
    const ok = list.length < max;
    if (ok) list.push(now);
    this.hits.set(k, list);
    if (this.hits.size > 50_000) this.hits.clear();
    return { ok, remaining: Math.max(0, max - list.length), resetAt: (list[0] ?? now) + windowSec * 1000 };
  }
}

class UpstashLimiter implements Limiter {
  private limiters = new Map<LimitName, Ratelimit>();
  constructor(private redis: Redis) {}

  async limit(name: LimitName, key: string): Promise<LimitResult> {
    let rl = this.limiters.get(name);
    if (!rl) {
      const [max, windowSec] = limitFor(name);
      rl = new Ratelimit({
        redis: this.redis,
        limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
        prefix: `sl:${name}`,
        analytics: false,
      });
      this.limiters.set(name, rl);
    }
    const r = await rl.limit(key);
    return { ok: r.success, remaining: r.remaining, resetAt: r.reset };
  }
}

let instance: Limiter | undefined;

function redisConfig() {
  const e = env();
  return { url: e.UPSTASH_REDIS_REST_URL ?? e.KV_REST_API_URL, token: e.UPSTASH_REDIS_REST_TOKEN ?? e.KV_REST_API_TOKEN };
}

/** Pour l'admin : la limitation est-elle partagée entre serveurs (Upstash) ? */
export function limiterKind(): "upstash" | "memory" {
  const { url, token } = redisConfig();
  return url && token ? "upstash" : "memory";
}

function limiter(): Limiter {
  if (!instance) {
    const { url, token } = redisConfig();
    instance = url && token ? new UpstashLimiter(new Redis({ url, token })) : new MemoryLimiter();
  }
  return instance;
}

/** Vérifie toutes les clés ; la première qui dépasse bloque. */
export async function rateLimit(name: LimitName, ...keys: string[]): Promise<LimitResult> {
  let last: LimitResult = { ok: true, remaining: Infinity, resetAt: 0 };
  for (const key of keys) {
    last = await limiter().limit(name, key);
    if (!last.ok) return last;
  }
  return last;
}
