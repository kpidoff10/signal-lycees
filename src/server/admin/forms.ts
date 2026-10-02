// Outils communs aux actions admin : lecture de FormData et validation Zod.
import { z } from "zod";

export interface ActionState {
  ok?: boolean;
  error?: string;
  message?: string;
}

export const initialActionState: ActionState = {};

export function formToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && !k.startsWith("$ACTION")) out[k] = v;
  }
  return out;
}

export type Parsed<T> = { ok: true; data: T } | { ok: false; error: string };

export function parseForm<S extends z.ZodType>(schema: S, fd: FormData): Parsed<z.output<S>> {
  const r = schema.safeParse(formToObject(fd));
  if (r.success) return { ok: true, data: r.data };
  return { ok: false, error: r.error.issues[0]?.message ?? "Données invalides." };
}

export const PAGE_SIZE = 20;

/** Paramètre de page (?page=), toujours ≥ 1. */
export const pageSchema = z.coerce.number().int().min(1).max(10_000).catch(1);

export type SearchParams = Record<string, string | string[] | undefined>;

export function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Valeur d'un filtre de type énumération ; undefined si absente ou invalide. */
export function enumParam<T extends string>(values: readonly T[], v: string | string[] | undefined): T | undefined {
  const s = first(v);
  return s && (values as readonly string[]).includes(s) ? (s as T) : undefined;
}

/** Recherche libre bornée. */
export function textParam(v: string | string[] | undefined, max = 80): string {
  return (first(v) ?? "").trim().slice(0, max);
}

export const idSchema = z.string().trim().min(1).max(64).regex(/^[a-z0-9]+$/i, "Identifiant invalide.");

/** Raison interne facultative. */
export const internalReasonSchema = z
  .string()
  .trim()
  .max(1000, "Raison interne : 1 000 caractères maximum.")
  .optional()
  .transform((v) => (v ? v : undefined));

/** Erreur métier dont le message peut être montré tel quel à l'admin. */
export class AdminError extends Error {}
