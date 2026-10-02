# Signal Lycées

> Ce qui se passe dans ton lycée mérite d’être entendu.

Plateforme libre et gratuite où les lycéens signalent les problèmes de leur établissement (locaux, cantine, cours,
sécurité…), confirment ceux des autres et les voient sur une carte de France. Des faits, pas un classement :
aucune note, aucun palmarès, aucune personne visée.

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · Prisma 7 · PostgreSQL (Neon : pgvector, pg_trgm, unaccent)
· MapLibre GL · Zod · TanStack Query · modération Jev (TypeSafe AI) · Cloudflare Turnstile · Upstash · Vercel.

## Démarrer

```bash
cp .env.example .env            # puis renseigner APP_SECRET
docker compose up -d            # Postgres + serveur de dev sur http://127.0.0.1:3100
./dev.sh npm install
./dev.sh npx prisma migrate deploy && ./dev.sh npx prisma generate
./dev.sh npm run import:schools # lycées depuis l'Open Data
./dev.sh npx tsx prisma/seed.ts # facultatif : données fictives de développement
```

## Déployer (Vercel + Neon)

1. Créer une base Neon (région UE) ; `DATABASE_URL` = URL poolée, `DIRECT_URL` = URL directe.
2. Variables Vercel : voir `.env.example` (APP_SECRET, TYPESAFE_API_KEY, VOYAGE_API_KEY, TURNSTILE, UPSTASH, CRON_SECRET…).
3. `npx prisma migrate deploy`, `npm run import:schools`, `npm run admin:create -- <identifiant> ADMIN --totp`.
4. Les tâches planifiées (`vercel.json`) recalculent les statuts et purgent les données selon la politique de conservation.

## Licence

[AGPL-3.0](LICENSE). Données des établissements : Annuaire de l’éducation (Licence Ouverte). Contours : IGN / INSEE.
Polices Bricolage Grotesque et Instrument Sans (SIL OFL).
