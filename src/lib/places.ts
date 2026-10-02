// Noms et adresses des villes et départements (fonctions pures, testées).

/** « Haute-Garonne » → « haute-garonne », « Saint-Étienne » → « saint-etienne ». */
export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ARRONDISSEMENT = /\s+(\d{1,2})\s*(?:er|e|ème)\s+arrondissement\s*$/i;

/** Commune sans l'arrondissement : « Paris 14e  Arrondissement » → « Paris ». */
export function baseCity(raw: string): string {
  return raw.replace(ARRONDISSEMENT, "").replace(/\s+/g, " ").trim();
}

/** Nom affichable : « Paris 14e  Arrondissement » → « Paris 14e ». */
export function cityLabel(raw: string): string {
  return raw
    .replace(ARRONDISSEMENT, (_, n: string) => ` ${n}${n === "1" ? "er" : "e"}`)
    .replace(/\s+/g, " ")
    .trim();
}

/** « à Paris », « au Havre », « aux Lilas » : la préposition qui va devant une commune. */
export function inCity(city: string): string {
  if (/^Le\s/i.test(city)) return `au ${city.slice(3)}`;
  if (/^Les\s/i.test(city)) return `aux ${city.slice(4)}`;
  return `à ${city}`;
}
