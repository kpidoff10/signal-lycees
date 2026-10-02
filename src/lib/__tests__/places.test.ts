import { describe, expect, it } from "vitest";
import { baseCity, cityLabel, inCity, slugify } from "../places";

describe("villes et départements", () => {
  it("fabrique des adresses lisibles", () => {
    expect(slugify("Haute-Garonne")).toBe("haute-garonne");
    expect(slugify("Saint-Étienne-du-Rouvray")).toBe("saint-etienne-du-rouvray");
    expect(slugify("L’Haÿ-les-Roses")).toBe("l-hay-les-roses");
    expect(slugify("Côtes-d'Armor")).toBe("cotes-d-armor");
  });
  it("regroupe les arrondissements sous leur commune", () => {
    expect(baseCity("Paris 14e  Arrondissement")).toBe("Paris");
    expect(baseCity("Paris  6e  Arrondissement")).toBe("Paris");
    expect(baseCity("Lyon 1er Arrondissement")).toBe("Lyon");
    expect(baseCity("Marseille")).toBe("Marseille");
    expect(cityLabel("Paris  6e  Arrondissement")).toBe("Paris 6e");
    expect(cityLabel("Lyon 1 er Arrondissement")).toBe("Lyon 1er");
  });
  it("accorde la préposition", () => {
    expect(inCity("Paris")).toBe("à Paris");
    expect(inCity("Le Havre")).toBe("au Havre");
    expect(inCity("Les Lilas")).toBe("aux Lilas");
  });
});
