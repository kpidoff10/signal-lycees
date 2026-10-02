import { z } from "zod";
import { CATEGORIES, type CategoryId } from "./categories";

export const PERIODS = [
  { value: "today", label: "Aujourd’hui", days: 1 },
  { value: "7d", label: "7 jours", days: 7 },
  { value: "30d", label: "30 jours", days: 30 },
  { value: "all", label: "Tout", days: null },
] as const;
export type Period = (typeof PERIODS)[number]["value"];

export interface MapFilters {
  cats: CategoryId[];
  activeOnly: boolean;
  period: Period;
  /** N'afficher que les lycées avec une mobilisation en cours. */
  mobOnly?: boolean;
}

export const DEFAULT_FILTERS: MapFilters = { cats: [], activeOnly: true, period: "all" };

const slugToId = new Map(CATEGORIES.map((c) => [c.slug, c.id]));

export const mapQuerySchema = z.object({
  cats: z
    .string()
    .max(200)
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((s) => slugToId.get(s as never))
        .filter((x): x is CategoryId => !!x),
    ),
  active: z.enum(["0", "1"]).default("1").transform((v) => v === "1"),
  period: z.enum(["today", "7d", "30d", "all"]).default("all"),
  mob: z.enum(["0", "1"]).default("0").transform((v) => v === "1"),
});

export function filtersToQuery(f: MapFilters): string {
  const p = new URLSearchParams();
  if (f.cats.length) p.set("cats", f.cats.map((id) => CATEGORIES.find((c) => c.id === id)!.slug).join(","));
  p.set("active", f.activeOnly ? "1" : "0");
  p.set("period", f.period);
  if (f.mobOnly) p.set("mob", "1");
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
