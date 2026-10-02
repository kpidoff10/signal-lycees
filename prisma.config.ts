import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // URL directe (non poolée) pour les migrations ; l'application utilise DATABASE_URL.
    url: env("DIRECT_URL"),
  },
});
