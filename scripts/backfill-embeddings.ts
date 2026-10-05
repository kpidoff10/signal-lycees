// Calcule l'embedding des problèmes publiés qui n'en ont pas (créés avant le branchement d'OpenAI,
// ou pendant une panne de la passerelle). Usage : npm run backfill:embeddings [-- --dry-run]
import "dotenv/config";
import { embedMany } from "ai";
import { scriptPrisma } from "./lib/prisma";

const DIM = 1024;
const MODEL = process.env.EMBEDDING_MODEL ?? "openai/text-embedding-3-small";

async function main() {
  const dry = process.argv.includes("--dry-run");
  const prisma = scriptPrisma();
  try {
    const rows = await prisma.$queryRaw<{ id: string; title: string; description: string }[]>`
      SELECT id, title, description FROM "Issue"
       WHERE embedding IS NULL AND "moderationStatus" IN ('PUBLISHED', 'AUTO_APPROVED')`;
    console.log(`${rows.length} problème(s) sans embedding.`);
    if (dry || !rows.length) return;
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { embeddings } = await embedMany({
        model: MODEL,
        values: batch.map((r) => `${r.title}. ${r.description}`),
        providerOptions: { openai: { dimensions: DIM } },
      });
      for (const [j, v] of embeddings.entries()) {
        if (v.length !== DIM) throw new Error(`Dimension inattendue : ${v.length}`);
        await prisma.$executeRawUnsafe(`UPDATE "Issue" SET embedding = $1::vector WHERE id = $2`, `[${v.join(",")}]`, batch[j]!.id);
      }
      console.log(`${Math.min(i + 50, rows.length)} / ${rows.length}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
