import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { publicEnv } from "@/lib/env";
import { PUBLIC_ISSUE_WHERE } from "@/server/issues";
import { directory } from "@/server/places";

export const revalidate = 86400;

// Sitemap : pages publiques, départements, et seulement les lycées (et leurs communes) qui ont du contenu :
// un problème publié, une mobilisation publiée ou un article de presse. Avec les ~7 400 fiches de tous
// les lycées, Google (site jeune) les laissait toutes en « Détectée, actuellement non indexée » (Search
// Console, 12/10). Les fiches vides restent accessibles et entrent ici dès qu'elles ont du contenu.
// Les problèmes individuels ne sont pas indexés.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl.replace(/\/$/, "");
  const [issues, mobilizations, press, dir] = await Promise.all([
    prisma.issue.findMany({ where: PUBLIC_ISSUE_WHERE, select: { schoolId: true, lastActivityAt: true } }),
    prisma.mobilization.findMany({ where: { status: "PUBLISHED" }, select: { schoolId: true, happenedOn: true } }),
    prisma.pressArticle.findMany({ where: { status: "PUBLISHED" }, select: { schoolIds: true, publishedAt: true } }),
    directory(),
  ]);

  // Dernière activité connue de chaque lycée qui a du contenu.
  const lastBySchool = new Map<string, Date>();
  const touch = (id: string, at: Date) => {
    const prev = lastBySchool.get(id);
    if (!prev || at > prev) lastBySchool.set(id, at);
  };
  for (const i of issues) touch(i.schoolId, i.lastActivityAt);
  for (const m of mobilizations) touch(m.schoolId, m.happenedOn);
  for (const p of press) for (const id of p.schoolIds) touch(id, p.publishedAt);

  // L'annuaire ne contient que les lycées ouverts.
  const schools = [...dir.cityBySlug.values()].flatMap((c) => c.schools).filter((s) => lastBySchool.has(s.id));
  const citySlugs = new Set(schools.map((s) => s.citySlug));

  const statics = ["", "/comment-ca-marche", "/regles", "/aide", "/confidentialite", "/cgu", "/mentions-legales", "/contact", "/presse", "/statistiques", "/affiches", "/lycees", "/actualites"];
  return [
    ...statics.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.5 })),
    ...dir.departments.map((d) => ({ url: `${base}/departement/${d.slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
    ...[...citySlugs].map((slug) => ({ url: `${base}/ville/${slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
    ...schools.map((s) => ({ url: `${base}/lycee/${s.slug}`, lastModified: lastBySchool.get(s.id), changeFrequency: "daily" as const, priority: 0.7 })),
  ];
}
