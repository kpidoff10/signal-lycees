// Filtres de la carte, partagés avec le navigateur : pas de Zod ici (voir map-query.ts, côté serveur).
import { CATEGORIES, type CategoryId } from "./categories";

export const PERIODS = [
  { value: "today", label: "Aujourd’hui", days: 1 },
  { value: "7d", label: "7 jours", days: 7 },
  { value: "30d", label: "30 jours", days: 30 },
  { value: "all", label: "Tout", days: null },
] as const;
export type Period = (typeof PERIODS)[number]["value"];

export type MobMode = "show" | "hide" | "only";

export interface MapFilters {
  cats: CategoryId[];
  activeOnly: boolean;
  period: Period;
  /** Mobilisations : affichées (défaut), masquées, ou seules affichées. */
  mobs?: MobMode;
}

export const DEFAULT_FILTERS: MapFilters = { cats: [], activeOnly: true, period: "all" };

export function filtersToQuery(f: MapFilters): string {
  const p = new URLSearchParams();
  if (f.cats.length) p.set("cats", f.cats.map((id) => CATEGORIES.find((c) => c.id === id)!.slug).join(","));
  p.set("active", f.activeOnly ? "1" : "0");
  p.set("period", f.period);
  if (f.mobs && f.mobs !== "show") p.set("mob", f.mobs);
  return p.toString();
}

export function periodStart(period: Period, now = new Date()): Date | null {
  if (period === "all") return null;
  if (period === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(now.getTime() - (period === "7d" ? 7 : 30) * 86_400_000);
}

/** Seuils de taille des marqueurs (design system) : 1–5, 6–20, plus de 20. */
export function markerLevel(count: number): 1 | 2 | 3 {
  return count > 20 ? 3 : count > 5 ? 2 : 1;
}
