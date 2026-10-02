// Transformation des enregistrements de l'Annuaire de l'éducation en lycées.
// Fonction pure, testée (scripts/lib/schools.test.ts).
import { normalize, slugify } from "../../src/lib/text";

export interface AnnuaireRecord {
  identifiant_de_l_etablissement: string;
  nom_etablissement: string;
  type_etablissement: string;
  statut_public_prive?: string | null;
  adresse_1?: string | null;
  code_postal?: string | null;
  nom_commune?: string | null;
  libelle_departement?: string | null;
  libelle_academie?: string | null;
  libelle_region?: string | null;
  voie_generale?: string | null;
  voie_technologique?: string | null;
  voie_professionnelle?: string | null;
  lycee_agricole?: string | null;
  lycee_militaire?: string | null;
  libelle_nature?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  etat?: string | null;
}

export interface SchoolRow {
  uai: string;
  name: string;
  type: string;
  sector: string | null;
  address: string | null;
  postalCode: string;
  city: string;
  academy: string | null;
  department: string | null;
  region: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  searchText: string;
  baseSlug: string;
}

export function schoolType(r: AnnuaireRecord): string {
  if (r.lycee_agricole === "1") return "Lycée agricole";
  if (r.lycee_militaire === "1") return "Lycée militaire";
  const gt = r.voie_generale === "1" || r.voie_technologique === "1";
  const pro = r.voie_professionnelle === "1";
  if (gt && pro) return "Lycée polyvalent";
  if (pro) return "Lycée professionnel";
  const nature = (r.libelle_nature ?? "").toUpperCase();
  if (nature.includes("PROFESSIONNEL")) return "Lycée professionnel";
  if (nature.includes("POLYVALENT")) return "Lycée polyvalent";
  if (nature.includes("AGRICOLE")) return "Lycée agricole";
  return "Lycée général et technologique";
}

/** « LYCEE GENERAL VICTOR HUGO » → « Lycée général Victor Hugo » (noms souvent en capitales). */
export function prettyName(name: string): string {
  const trimmed = name.replace(/\s+/g, " ").trim();
  if (trimmed !== trimmed.toUpperCase()) return trimmed;
  const small = new Set(["de", "du", "des", "la", "le", "les", "et", "en", "aux", "au", "d", "l", "sur", "sous"]);
  return trimmed
    .toLowerCase()
    .split(" ")
    .map((w, i) => {
      if (w === "lycee") return "Lycée";
      if (i > 0 && small.has(w)) return w;
      return w.replace(/(^|[-'])([a-zà-ÿ])/g, (_, p: string, c: string) => p + c.toUpperCase());
    })
    .join(" ");
}

const REGION_LABELS: Record<string, string> = { "Ile-de-France": "Île-de-France" };

export function toSchoolRow(r: AnnuaireRecord): SchoolRow | null {
  const lat = r.latitude;
  const lng = r.longitude;
  if (!r.identifiant_de_l_etablissement || !r.nom_etablissement || !r.code_postal || !r.nom_commune) return null;
  if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const name = prettyName(r.nom_etablissement);
  const city = r.nom_commune.trim();
  const nameForSlug = /lyc[ée]e/i.test(name) ? name : `lycee ${name}`;
  return {
    uai: r.identifiant_de_l_etablissement.trim().toUpperCase(),
    name,
    type: schoolType(r),
    sector: r.statut_public_prive ?? null,
    address: r.adresse_1?.trim() || null,
    postalCode: r.code_postal.trim(),
    city,
    academy: r.libelle_academie ?? null,
    department: r.libelle_departement ?? null,
    region: REGION_LABELS[r.libelle_region ?? ""] ?? r.libelle_region ?? "Autre",
    latitude: lat,
    longitude: lng,
    isOpen: (r.etat ?? "OUVERT") === "OUVERT",
    searchText: normalize(`${name} ${city} ${r.code_postal}`),
    baseSlug: slugify(`${nameForSlug} ${city}`),
  };
}

/** Attribue des slugs uniques ; un lycée déjà connu garde le sien (stabilité des URL). */
export function assignSlugs(rows: SchoolRow[], existing: Map<string, string>): Map<string, string> {
  const result = new Map<string, string>();
  const used = new Set(existing.values());
  for (const row of rows) {
    const known = existing.get(row.uai);
    if (known) result.set(row.uai, known);
  }
  for (const row of rows) {
    if (result.has(row.uai)) continue;
    let slug = row.baseSlug;
    if (used.has(slug)) slug = `${row.baseSlug}-${row.uai.toLowerCase()}`;
    used.add(slug);
    result.set(row.uai, slug);
  }
  return result;
}
