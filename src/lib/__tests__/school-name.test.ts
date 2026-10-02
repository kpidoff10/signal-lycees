import { describe, expect, it } from "vitest";
import { shortSchoolName } from "../school-name";

describe("shortSchoolName", () => {
  it.each([
    ["Lycée général et technologique des Arènes", "Lycée des Arènes"],
    ["Lycée polyvalent Joseph Gallieni", "Lycée Joseph Gallieni"],
    ["Lycée professionnel Magnan", "Lycée Magnan"],
    ["Lycée polyvalent privé Saint-Vincent de Paul", "Lycée Saint-Vincent de Paul"],
    ["Lycée Carnot", "Lycée Carnot"],
    ["Section d'enseignement professionnel du Lycée Gutenberg", "Lycée Gutenberg (section)"],
    ["Cité scolaire Monnet Fourneyron - LEGT Jean Monnet", "Cité scolaire Monnet Fourneyron - LEGT Jean Monnet"],
  ])("%s → %s", (input, expected) => expect(shortSchoolName(input)).toBe(expected));
});
