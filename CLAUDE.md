@AGENTS.md

# Signal Lycées

Site web (pas d'application mobile) où les lycéens signalent anonymement des problèmes de leur établissement,
les confirment et les voient sur une carte de France. Projet libre (AGPL-3.0), porté par Kevin.

## Règles du produit (non négociables)

- Un signalement décrit une **situation**, jamais une personne. Tout contenu ambigu part en `MANUAL_REVIEW`.
- **Aucun classement, note ou comparaison entre lycées.** Les chiffres sont toujours des volumes avec leur unité.
  Les listes de lycées se trient par distance, jamais par nombre de problèmes.
- **Zéro donnée personnelle** : pas de compte, pas d'e-mail. Identité anonyme = cookie signé `sl_id`.
  L'IP n'est jamais stockée en clair (HMAC avec sel journalier).
- Le 👎 « pas sérieux » n'a jamais de compteur public et ne masque jamais un problème automatiquement.
- Le LLM (Jev) n'est jamais l'unique barrière : règles déterministes (`src/server/moderation/rules.ts`) + Jev + humain.
- Jamais de séparateur noir dans l'interface (traits en `var(--border)`).
- Jamais de données fictives en production (`prisma/seed.ts` refuse de tourner sur Neon).

## Environnement

Node n'est pas installé sur l'hôte : tout passe par Docker.

- `docker compose up -d` : Postgres pgvector (port 55432) + serveur de dev (http://127.0.0.1:3100).
- `./dev.sh <commande>` : exécute une commande dans le conteneur Node (`./dev.sh npm test`).
- `./e2e/run.sh` : tests Playwright (smartphone, tablette, desktop) contre le serveur de dev.
- `docker-compose.override.yml` (non versionné) : aperçu exposé via Traefik, protégé par mot de passe
  (domaine dans `DEV_ALLOWED_ORIGINS`).

## Commandes

- `./dev.sh npm test` (Vitest), `./dev.sh npm run lint`, `./dev.sh npm run typecheck`, `./e2e/run.sh`
- `./dev.sh npm run import:schools` : import / mise à jour des ~5 600 lycées (Annuaire de l'éducation, idempotent sur l'UAI)
- `./dev.sh npx tsx prisma/seed.ts` : données fictives de développement
- `ADMIN_PASSWORD=… ./dev.sh npm run admin:create -- <identifiant> ADMIN [--totp]`
- `python3 scripts/build-regions.py` : régénère `public/geo/regions.json`

## Pièges connus

- **Migrations** : Prisma ne sait pas décrire l'index vectoriel HNSW et veut le supprimer. Créer les migrations avec
  `./scripts/migrate.sh <nom>` (qui retire ce DROP), jamais avec `prisma migrate dev`.
- **MapLibre 6** charge son worker par URL : `scripts/copy-maplibre.mjs` (postinstall) le copie dans `public/maplibre/`.
  Le conteneur de la carte doit garder `position: absolute` en style inline (la CSS MapLibre le remet en relative).
- **Limites de débit** : des centaines d'élèves partagent l'IP de leur lycée (NAT). Limites strictes par identité,
  larges par IP (`src/server/rate-limit.ts`). `RATE_LIMIT_MULTIPLIER` ne s'applique qu'hors production.
- **Turnstile** : un jeton ne sert qu'une fois (`requireParticipant(token, { captchaVerified: true })` après vérification).

## Organisation

- `src/app/(public)/` : site public (accueil, `/lycee/[slug]`, `/probleme/[id]`, `/signaler`, `/suivi/[token]`, pages d'info).
- `src/app/admin/` : back-office (`requireAdmin()` au début de chaque page et action).
- `src/app/actions/issues.ts` : actions serveur participatives (votes, dépôt, doublons, signalement de contenu).
- `src/server/` : logique serveur. `moderation/` (règles, Jev, décision), `issues.ts`, `status.ts` (statuts, pure),
  `duplicates.ts` (pgvector ou repli pg_trgm), `identity.ts`, `rate-limit.ts`, `cron.ts` (statuts, purge RGPD).
- `src/styles/` : tokens et composants issus de la maquette (design system de Kevin).
