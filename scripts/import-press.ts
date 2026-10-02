// Importe des problèmes repris de la presse (origin = PRESS), marqués par un lot.
// Usage : npm run import:press -- data/presse-2026-10.json
// Idempotent : un problème déjà importé (même lot, lycée et titre) est ignoré.
// Aucune confirmation n'est inventée : le compteur démarre à 0.
import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { CATEGORY_IDS } from "../src/lib/categories";
import { scriptPrisma } from "./lib/prisma";

const fileSchema = z.object({
  batch: z.string().regex(/^[a-z0-9-]{3,40}$/),
  issues: z.array(
    z.object({
      school: z.string().min(1),
      category: z.enum(CATEGORY_IDS),
      title: z.string().min(8).max(80),
      description: z.string().min(20).max(1000),
      source: z.object({ name: z.string().min(2), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), url: z.string().url() }),
    }),
  ),
});

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("Usage : npm run import:press -- <fichier.json>");
  const data = fileSchema.parse(JSON.parse(await readFile(path, "utf8")));
  const prisma = scriptPrisma();
  let created = 0;
  for (const item of data.issues) {
    const school = await prisma.school.findUnique({ where: { slug: item.school }, select: { id: true, name: true } });
    if (!school) {
      console.warn(`Lycée introuvable, ignoré : ${item.school}`);
      continue;
    }
    const exists = await prisma.issue.findFirst({ where: { importBatch: data.batch, schoolId: school.id, title: item.title } });
    if (exists) continue;
    const date = new Date(`${item.source.date}T09:00:00Z`);
    await prisma.issue.create({
      data: {
        schoolId: school.id,
        category: item.category,
        title: item.title,
        description: item.description,
        origin: "PRESS",
        importBatch: data.batch,
        sourceName: item.source.name,
        sourceUrl: item.source.url,
        sourceDate: date,
        moderationStatus: "PUBLISHED",
        upCount: 0,
        trackingTokenHash: createHash("sha256").update(randomBytes(32)).digest("hex"),
        createdAt: date,
        publishedAt: new Date(),
        lastActivityAt: date,
        events: { create: [{ type: "CREATED", createdAt: date }, { type: "PUBLISHED" }] },
      },
    });
    created++;
    console.log(`+ ${school.name} : ${item.title}`);
  }
  console.log(`${created} problème(s) importé(s) dans le lot « ${data.batch} ».`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
