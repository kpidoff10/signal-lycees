// Retire tous les problèmes d'un lot importé (ex. presse-2026-10), avec leurs votes et événements.
// Usage : npm run import:remove -- <lot>   (ajouter --dry-run pour seulement compter)
import { scriptPrisma } from "./lib/prisma";

async function main() {
  const batch = process.argv[2];
  const dry = process.argv.includes("--dry-run");
  if (!batch || batch.startsWith("--")) throw new Error("Usage : npm run import:remove -- <lot> [--dry-run]");
  const prisma = scriptPrisma();
  const where = { importBatch: batch, origin: "PRESS" as const };
  const count = await prisma.issue.count({ where });
  if (dry) console.log(`${count} problème(s) seraient supprimés (lot « ${batch} »).`);
  else {
    const r = await prisma.issue.deleteMany({ where });
    console.log(`${r.count} problème(s) supprimé(s) (lot « ${batch} »).`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
