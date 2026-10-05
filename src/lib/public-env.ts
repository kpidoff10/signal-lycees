// Variables publiques (NEXT_PUBLIC_*), lisibles dans le navigateur. Fichier sans dépendance :
// l'importer côté client n'embarque pas Zod (contrairement à env.ts).
export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined,
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || undefined,
};
