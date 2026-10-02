// Importe des mobilisations rapportées par la presse (origin = PRESS), marquées par un lot.
// Usage : npm run import:mobilizations -- data/mobilisations-2026-10.json
// Retrait : npm run import:remove-mobilizations -- <lot>
// Les mobilisations déjà expirées (date + MOBILIZATION_TTL_HOURS) sont ignorées.
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { expiryFor, startOfDay } from "../src/lib/mobilization";
import { scriptPrisma } from "./lib/prisma";

const fileSchema = z.object({
  batch: z.string().regex(/^[a-z0-9-]{3,40}$/),
  mobilizations: z.array(
    z.object({ school: z.string().min(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), sourceName: z.string().min(2), sourceUrl: z.string().url() }),
  ),
});

async function main() {
  const [path] = process.argv.slice(2);
  if (!path) throw new Error("Usage : npm run import:mobilizations -- <fichier.json>");
  const ttl = Number(process.env.MOBILIZATION_TTL_HOURS ?? 72);
  const data = fileSchema.parse(JSON.parse(await readFile(path, "utf8")));
  const prisma = scriptPrisma();
  let created = 0;
  let expired = 0;
  for (const m of data.mobilizations) {
    const school = await prisma.school.findUnique({ where: { slug: m.school }, select: { id: true, name: true } });
    if (!school) {
      console.warn(`Lycée introuvable : ${m.school}`);
      continue;
    }
    const happenedOn = startOfDay(new Date(`${m.date}T12:00:00Z`));
    const expiresAt = expiryFor(happenedOn, ttl);
    if (expiresAt <= new Date()) {
      expired++;
      continue;
    }
    const exists = await prisma.mobilization.findFirst({ where: { importBatch: data.batch, schoolId: school.id } });
    if (exists) continue;
    await prisma.mobilization.create({
      data: {
        schoolId: school.id,
        origin: "PRESS",
        status: "PUBLISHED",
        happenedOn,
        expiresAt,
        sourceName: m.sourceName,
        sourceUrl: m.sourceUrl,
        importBatch: data.batch,
        reviewedAt: new Date(),
      },
    });
    created++;
  }
  console.log(`${created} mobilisation(s) importée(s) dans le lot « ${data.batch} » (${expired} déjà expirée(s), ignorée(s)).`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
