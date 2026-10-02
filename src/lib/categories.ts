// Les 7 catégories (décision du 2026-10-02 : 6 de la maquette + « Autres »).
// Les emojis sont réservés aux catégories et toujours suivis du libellé.
export const CATEGORIES = [
  { id: "BUILDING", slug: "locaux", label: "Locaux", emoji: "🏫", hint: "Bâtiments, salles, sanitaires, chauffage, matériel" },
  { id: "CATERING", slug: "restauration", label: "Restauration", emoji: "🍽️", hint: "Cantine, attente, menus, hygiène" },
  { id: "CLASSES", slug: "cours", label: "Cours", emoji: "📚", hint: "Cours non assurés, remplacements, effectifs" },
  { id: "ORGANIZATION", slug: "organisation", label: "Organisation", emoji: "📅", hint: "Emplois du temps, horaires, informations" },
  { id: "SECURITY", slug: "securite", label: "Sécurité", emoji: "🛡️", hint: "Accès, abords, installations dangereuses" },
  { id: "ACCESSIBILITY", slug: "accessibilite", label: "Accessibilité", emoji: "♿", hint: "Ascenseurs, rampes, aménagements" },
  { id: "OTHER", slug: "autres", label: "Autres", emoji: "💬", hint: "Tout ce qui n'entre pas dans les autres catégories" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];

const byId = new Map(CATEGORIES.map((c) => [c.id, c]));
const bySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function category(id: CategoryId) {
  return byId.get(id)!;
}

export function categoryFromSlug(slug: string) {
  return bySlug.get(slug as CategorySlug);
}

export function isCategoryId(value: string): value is CategoryId {
  return byId.has(value as CategoryId);
}
