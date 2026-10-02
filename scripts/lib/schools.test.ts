import { describe, expect, it } from "vitest";
import { assignSlugs, prettyName, schoolType, toSchoolRow, type AnnuaireRecord } from "./schools";

const rec: AnnuaireRecord = {
  identifiant_de_l_etablissement: "0210012A",
  nom_etablissement: "LYCEE GENERAL CARNOT",
  type_etablissement: "Lycée",
  statut_public_prive: "Public",
  adresse_1: "16 boulevard Thiers",
  code_postal: "21000",
  nom_commune: "Dijon",
  libelle_departement: "Côte-d'Or",
  libelle_academie: "Dijon",
  libelle_region: "Bourgogne-Franche-Comté",
  voie_generale: "1",
  voie_technologique: "1",
  voie_professionnelle: "0",
  latitude: 47.32,
  longitude: 5.05,
  etat: "OUVERT",
};

describe("import des lycées", () => {
  it("transforme un enregistrement", () => {
    const row = toSchoolRow(rec)!;
    expect(row).toMatchObject({ uai: "0210012A", name: "Lycée General Carnot", city: "Dijon", type: "Lycée général et technologique", isOpen: true });
    expect(row.baseSlug).toBe("lycee-general-carnot-dijon");
    expect(row.searchText).toBe("lycee general carnot dijon 21000");
  });
  it("ignore les enregistrements sans coordonnées", () => {
    expect(toSchoolRow({ ...rec, latitude: null })).toBeNull();
  });
  it("détermine le type", () => {
    expect(schoolType({ ...rec, voie_professionnelle: "1" })).toBe("Lycée polyvalent");
    expect(schoolType({ ...rec, voie_generale: "0", voie_technologique: "0", voie_professionnelle: "1" })).toBe("Lycée professionnel");
    expect(schoolType({ ...rec, lycee_agricole: "1" })).toBe("Lycée agricole");
  });
  it("met en forme les noms en capitales seulement", () => {
    expect(prettyName("LYCEE DES METIERS DE LA MER")).toBe("Lycée des Metiers de la Mer");
    expect(prettyName("Lycée Aux Lazaristes")).toBe("Lycée Aux Lazaristes");
  });
  it("garde les slugs existants et résout les collisions", () => {
    const a = toSchoolRow(rec)!;
    const b = toSchoolRow({ ...rec, identifiant_de_l_etablissement: "0210099Z" })!;
    const slugs = assignSlugs([a, b], new Map());
    expect(slugs.get("0210012A")).toBe("lycee-general-carnot-dijon");
    expect(slugs.get("0210099Z")).toBe("lycee-general-carnot-dijon-0210099z");
    const kept = assignSlugs([a], new Map([["0210012A", "ancien-slug"]]));
    expect(kept.get("0210012A")).toBe("ancien-slug");
  });
});
