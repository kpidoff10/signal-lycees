import { describe, expect, it } from "vitest";
import { countLabel, formatNumber } from "../format";
import { cleanUserText, normalize, slugify } from "../text";
import { wilsonLowerBound } from "../wilson";
import { issueDraftSchema } from "../schemas";
import { CATEGORIES } from "../categories";

describe("format", () => {
  it("formate en français avec espace fine insécable", () => {
    expect(formatNumber(18742)).toBe("18 742");
    expect(countLabel(1, "confirmation")).toBe("1 confirmation");
    expect(countLabel(147, "confirmation")).toBe("147 confirmations");
    expect(countLabel(0, "problème actif", "problèmes actifs")).toBe("0 problème actif");
  });
});

describe("text", () => {
  it("normalise et crée des slugs", () => {
    expect(normalize("  Lycée   Carnot ")).toBe("lycee carnot");
    expect(slugify("Lycée Général & Technologique Carnot — Dijon")).toBe("lycee-general-technologique-carnot-dijon");
  });
  it("nettoie les caractères invisibles", () => {
    expect(cleanUserText("a​b\u0007c   d\n\n\n\ne")).toBe("abc d\n\ne");
  });
});

describe("wilson", () => {
  it("ne fait pas passer 2/0 devant 140/10", () => {
    expect(wilsonLowerBound(140, 10)).toBeGreaterThan(wilsonLowerBound(2, 0));
  });
  it("0 vote → 0", () => expect(wilsonLowerBound(0, 0)).toBe(0));
});

describe("issueDraftSchema", () => {
  const ok = { schoolId: "s1", category: "BUILDING", title: "Plusieurs salles sans chauffage", description: "Depuis lundi, le bâtiment B n'a plus de chauffage." };
  it("accepte un brouillon valide", () => expect(issueDraftSchema.safeParse(ok).success).toBe(true));
  it("refuse une catégorie inconnue ou un texte trop court", () => {
    expect(issueDraftSchema.safeParse({ ...ok, category: "TEACHER" }).success).toBe(false);
    expect(issueDraftSchema.safeParse({ ...ok, title: "froid" }).success).toBe(false);
    expect(issueDraftSchema.safeParse({ ...ok, description: "x".repeat(1001) }).success).toBe(false);
  });
  it("7 catégories", () => expect(CATEGORIES).toHaveLength(7));
});

import { formatDay } from "../format";
describe("formatDay", () => {
  it("écrit « 1er » pour le premier du mois", () => {
    expect(formatDay(new Date("2026-10-01T12:00:00Z"), new Date("2026-10-02T12:00:00Z"))).toBe("1er octobre");
    expect(formatDay(new Date("2026-10-02T12:00:00Z"), new Date("2026-10-02T12:00:00Z"))).toBe("2 octobre");
  });
});
