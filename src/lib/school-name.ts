// Nom court d'un établissement pour les listes étroites : le type (« général et
// technologique », « polyvalent »…) mange la place et cache le nom propre.
const TYPES =
  /^(?:lyc[ée]e)\s+(?:(?:priv[ée]\s+)?(?:g[ée]n[ée]ral et technologique|g[ée]n[ée]ral|technologique|polyvalent|professionnel|des m[ée]tiers(?: [^A-Z]+?)?)\s+)+(?:priv[ée]\s+)?/i;
const SECTION = /^(?:section d'enseignement [^ ]+(?: et technologique)?|sep|section enseignement professionnel(?:le)?)\s+(?:du|de la|de l')\s+/i;

export function shortSchoolName(name: string): string {
  let n = name.trim();
  const isSection = SECTION.test(n);
  n = n.replace(SECTION, "");
  n = n.replace(TYPES, "Lycée ");
  n = n.charAt(0).toUpperCase() + n.slice(1);
  return isSection ? `${n} (section)` : n;
}
