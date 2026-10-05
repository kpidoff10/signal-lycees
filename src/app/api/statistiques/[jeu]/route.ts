// Exports CSV des statistiques publiques (séparateur « ; » et BOM UTF-8 pour Excel en français).
import { getStatistics } from "@/server/statistics";

export const revalidate = 1800;

const JEUX = ["mobilisations", "themes", "regions"] as const;
type Jeu = (typeof JEUX)[number];

const cell = (v: string | number) => (typeof v === "number" ? String(v) : `"${v.replace(/"/g, '""')}"`);
const csv = (rows: (string | number)[][]) => "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n") + "\r\n";

export async function GET(_req: Request, { params }: { params: Promise<{ jeu: string }> }) {
  const { jeu } = await params;
  if (!JEUX.includes(jeu as Jeu)) return new Response("Jeu de données inconnu.", { status: 404 });
  const s = await getStatistics();
  const body =
    jeu === "mobilisations"
      ? csv([["jour", "lycees_mobilises"], ...s.mobilizationsByDay.map((d) => [d.day, d.schools])])
      : jeu === "themes"
        ? csv([["theme", "problemes_actifs"], ...s.byCategory.map((c) => [c.label, c.count])])
        : csv([
            ["region", "problemes_actifs", "lycees_avec_probleme", "lycees_mobilises_en_ce_moment", "lycees_mobilises_depuis_30_09"],
            ...s.byRegion.map((r) => [r.region, r.activeIssues, r.schoolsWithIssues, r.mobilizedNow, r.mobilizedSinceStart]),
          ]);
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="signal-lycees-${jeu}-${s.updatedAt.toISOString().slice(0, 10)}.csv"`,
    },
  });
}
