/** Minuscules, sans accents, espaces normalisés : sert à la recherche et aux règles. */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’'`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(input: string): string {
  return normalize(input)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

/** Retire les caractères de contrôle et les espaces superflus d'une saisie utilisateur. */
// Caractères de contrôle, espaces de largeur nulle et marques de direction (contournements).
const INVISIBLE = new RegExp(
  "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u200B-\\u200F\\u2028-\\u202E\\u2060-\\u206F\\uFEFF]",
  "g",
);

/** Retire les caractères de contrôle et les espaces superflus d'une saisie utilisateur. */
export function cleanUserText(input: string): string {
  return input
    .normalize("NFC")
    .replace(INVISIBLE, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
