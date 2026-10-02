import { z } from "zod";

// Variables serveur, validées au premier accès. Les variables facultatives
// désactivent proprement un service (voir .env.example) au lieu de faire planter.
const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const bool = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  APP_SECRET: z.string().min(32, "APP_SECRET doit faire au moins 32 caractères"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3100"),
  AI_GATEWAY_API_KEY: optional,
  /** Présent automatiquement sur Vercel : la passerelle IA s'authentifie seule. */
  VERCEL_OIDC_TOKEN: optional,
  JEV_GATEWAY_MODEL: z.string().default("typesafe-ai/jev"),
  TYPESAFE_API_KEY: optional,
  TYPESAFE_API_URL: z.string().url().default("https://api.typesafe.ai/v1/systemone"),
  JEV_MODEL: z.string().default("jev-latest"),
  JEV_DAILY_LIMIT: z.coerce.number().int().positive().default(5000),
  JEV_TIMEOUT_MS: z.coerce.number().int().positive().default(6000),
  VOYAGE_API_KEY: optional,
  VOYAGE_MODEL: z.string().default("voyage-3.5-lite"),
  TURNSTILE_SECRET_KEY: optional,
  UPSTASH_REDIS_REST_URL: optional,
  UPSTASH_REDIS_REST_TOKEN: optional,
  MODERATION_FREEZE: bool,
  PHOTOS_ENABLED: bool,
  CRON_SECRET: optional,
  /** Durée d'affichage d'une mobilisation après sa date (heures). */
  MOBILIZATION_TTL_HOURS: z.coerce.number().int().positive().default(72),
  TELEGRAM_BOT_TOKEN: optional,
  TELEGRAM_CHAT_ID: optional,
  /** Notifier aussi les signalements publiés automatiquement (pas seulement ceux à vérifier). */
  TELEGRAM_NOTIFY_PUBLISHED: z
    .string()
    .optional()
    .transform((v) => v !== "false" && v !== "0"),
  DUPLICATE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.82),
  DUPLICATE_TRGM_THRESHOLD: z.coerce.number().min(0).max(1).default(0.35),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

export function env(): ServerEnv {
  if (!cached) cached = serverSchema.parse(process.env);
  return cached;
}

/** Réservé aux tests. */
export function resetEnvCache() {
  cached = undefined;
}

export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined,
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || undefined,
};
