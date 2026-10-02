// Import / mise à jour des lycées depuis l'Annuaire de l'éducation (Open Data).
// Usage : npm run import:schools [-- --file chemin.json]
// Idempotent : upsert sur l'UAI ; un lycée fermé n'est jamais supprimé (isOpen = false).
import { readFile } from "node:fs/promises";
import { scriptPrisma } from "./lib/prisma";
import { assignSlugs, toSchoolRow, type AnnuaireRecord } from "./lib/schools";

const EXPORT_URL =
  "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/exports/json?where=" +
  encodeURIComponent('type_etablissement="Lycée"');

async function load(): Promise<AnnuaireRecord[]> {
  const i = process.argv.indexOf("--file");
  if (i > 0 && process.argv[i + 1]) {
    return JSON.parse(await readFile(process.argv[i + 1]!, "utf8")) as AnnuaireRecord[];
  }
  console.log("Téléchargement de l'annuaire…");
  const res = await fetch(EXPORT_URL);
  if (!res.ok) throw new Error(`Téléchargement impossible : HTTP ${res.status}`);
  return (await res.json()) as AnnuaireRecord[];
}

async function main() {
  const prisma = scriptPrisma();
  const records = await load();
  const rows = records.map(toSchoolRow).filter((r) => r !== null);
  console.log(`${records.length} enregistrements, ${rows.length} lycées exploitables.`);

  const existing = new Map((await prisma.school.findMany({ select: { uai: true, slug: true } })).map((s) => [s.uai, s.slug]));
  const slugs = assignSlugs(rows, existing);

  let created = 0;
  let updated = 0;
  for (let i = 0; i < rows.length; i += 250) {
    const chunk = rows.slice(i, i + 250);
    await prisma.$transaction(
      chunk.map((row) => {
        const { baseSlug: _ignored, ...data } = row;
        void _ignored;
        if (existing.has(row.uai)) updated++;
        else created++;
        return prisma.school.upsert({
          where: { uai: row.uai },
          create: { ...data, slug: slugs.get(row.uai)! },
          update: data,
        });
      }),
    );
    process.stdout.write(`\r${Math.min(i + 250, rows.length)}/${rows.length}`);
  }

  // Lycées disparus de l'annuaire : marqués fermés, jamais supprimés.
  const seen = new Set(rows.map((r) => r.uai));
  const gone = [...existing.keys()].filter((uai) => !seen.has(uai));
  if (gone.length) await prisma.school.updateMany({ where: { uai: { in: gone } }, data: { isOpen: false } });

  console.log(`\nTerminé : ${created} créés, ${updated} mis à jour, ${gone.length} marqués fermés.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
