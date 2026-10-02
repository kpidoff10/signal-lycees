// Retire toutes les mobilisations d'un lot importé. Usage : npm run import:remove-mobilizations -- <lot> [--dry-run]
import { scriptPrisma } from "./lib/prisma";

async function main() {
  const batch = process.argv[2];
  if (!batch || batch.startsWith("--")) throw new Error("Usage : npm run import:remove-mobilizations -- <lot> [--dry-run]");
  const prisma = scriptPrisma();
  const where = { importBatch: batch, origin: "PRESS" as const };
  if (process.argv.includes("--dry-run")) console.log(`${await prisma.mobilization.count({ where })} mobilisation(s) seraient supprimées.`);
  else console.log(`${(await prisma.mobilization.deleteMany({ where })).count} mobilisation(s) supprimée(s).`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
