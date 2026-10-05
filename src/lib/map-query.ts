// Validation des paramètres de /api/map (serveur uniquement : Zod reste hors du code envoyé au navigateur).
import { z } from "zod";
import { CATEGORIES, type CategoryId } from "./categories";

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
  mob: z.enum(["show", "hide", "only"]).default("show"),
});
