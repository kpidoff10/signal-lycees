// Recherche des lycées mobilisés un jour donné (Perplexity via la passerelle Vercel), en ligne de commande.
// Usage :
//   npm run research:mobilizations -- --date 2026-10-06 --regions            (une recherche par région)
//   npm run research:mobilizations -- --date 2026-10-05 --urls <url>,<url>   (lire des articles précis)
// Écrit data/mobilisations-<date>-<suffixe>.json au format de import:mobilizations (à relire, puis importer).
// N'écrit rien en base. Le site fait la même recherche tout seul deux fois par jour (voir src/server/research).
import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { researchMobilizations } from "../src/server/research/core";
import { scriptPrisma } from "./lib/prisma";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const date = arg("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("--date AAAA-MM-JJ requis");
  const urls = arg("urls")?.split(",").filter(Boolean) ?? [];
  const regions = process.argv.includes("--regions");
  if (!urls.length && !regions) throw new Error("--urls <url,url> ou --regions requis");

  const prisma = scriptPrisma();
  try {
    const r = await researchMobilizations(prisma, { date, regions, urls });
    const batch = `mobilisations-${date}-${regions ? "regions" : "articles"}`;
    const path = `data/${batch}.json`;
    const note = `Recherche Perplexity du ${new Date().toISOString().slice(0, 16)} (${r.requests} requête(s), ${r.failedRequests} en échec). Retrait : npm run import:remove-mobilizations -- ${batch}`;
    const mobilizations = r.candidates.map((c) => ({ school: c.slug, date, sourceName: c.sourceName, sourceUrl: c.sourceUrl }));
    await writeFile(path, JSON.stringify({ batch, note, mobilizations }, null, 2) + "\n");
    console.log(`${mobilizations.length} nouveau(x) lycée(s) → ${path} (${r.alreadyKnown} déjà sur la carte pour ce jour, ${r.failedRequests} requête(s) en échec).`);
    if (r.unmatched.length) console.log(`Introuvables dans l'annuaire (${r.unmatched.length}) :\n- ${r.unmatched.map((u) => `${u.name} (${u.city}) — ${u.url}`).join("\n- ")}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
