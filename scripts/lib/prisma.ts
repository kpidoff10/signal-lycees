// Client Prisma pour les scripts en ligne de commande (hors Next.js).
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

export function scriptPrisma() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}
