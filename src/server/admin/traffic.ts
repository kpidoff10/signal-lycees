// Fréquentation pour le tableau de bord : compteurs agrégés (voir src/server/traffic.ts).
import "server-only";
import { prisma } from "@/lib/db";
import { SHARE_LINKS } from "@/lib/share-links";
import { parisDay } from "@/lib/traffic";

const STATIC_LABELS: Record<string, string> = {
  "/": "Accueil",
  "/signaler": "Signaler un problème",
  "/comment-ca-marche": "Comment ça marche",
  "/regles": "Règles de publication",
  "/aide": "Besoin d’aide",
  "/confidentialite": "Confidentialité",
  "/cgu": "Conditions d’utilisation",
  "/mentions-legales": "Mentions légales",
  "/contact": "Contact",
  "/presse": "Espace presse",
  "/affiches": "Affiches à imprimer",
};

function dayDate(offset: number): Date {
  const d = new Date(`${parisDay()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - offset);
  return d;
}

export async function trafficOverview() {
  const since30 = dayDate(29);
  const since7 = dayDate(6);
  const [days, pages, sources, linkRows] = await Promise.all([
    prisma.trafficDay.findMany({ where: { day: { gte: since30 } }, orderBy: { day: "asc" } }),
    prisma.trafficPage.groupBy({ by: ["path"], where: { day: { gte: since7 } }, _sum: { views: true }, orderBy: { _sum: { views: "desc" } }, take: 10 }),
    prisma.trafficSource.groupBy({ by: ["source"], where: { day: { gte: since7 } }, _sum: { views: true }, orderBy: { _sum: { views: "desc" } }, take: 8 }),
    prisma.trafficSource.groupBy({
      by: ["source"],
      where: { day: { gte: since30 }, source: { in: SHARE_LINKS.map((l) => l.label) } },
      _sum: { views: true },
    }),
  ]);
  const linkVisits = new Map(linkRows.map((r) => [r.source, r._sum.views ?? 0]));

  // 30 jours complets, y compris les jours sans visite.
  const byDay = new Map(days.map((d) => [d.day.toISOString().slice(0, 10), d]));
  const series = Array.from({ length: 30 }, (_, i) => {
    const d = dayDate(29 - i);
    const key = d.toISOString().slice(0, 10);
    const row = byDay.get(key);
    return { day: key, visitors: row?.visitors ?? 0, views: row?.views ?? 0 };
  });
  const sum = (from: number, k: "visitors" | "views") => series.slice(from).reduce((s, d) => s + d[k], 0);

  // Noms lisibles pour les pages de lycée et de problème.
  const slugs = pages.map((p) => p.path.match(/^\/lycee\/([a-z0-9-]+)$/)?.[1]).filter((x): x is string => !!x);
  const issueIds = pages.map((p) => p.path.match(/^\/probleme\/([a-z0-9]+)$/)?.[1]).filter((x): x is string => !!x);
  const [schools, issues] = await Promise.all([
    slugs.length ? prisma.school.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true, city: true } }) : [],
    issueIds.length ? prisma.issue.findMany({ where: { id: { in: issueIds } }, select: { id: true, title: true } }) : [],
  ]);
  const schoolBy = new Map(schools.map((s) => [s.slug, `${s.name} (${s.city})`]));
  const issueBy = new Map(issues.map((i) => [i.id, `Problème : ${i.title}`]));
  const label = (path: string) => {
    if (STATIC_LABELS[path]) return STATIC_LABELS[path];
    const slug = path.match(/^\/lycee\/([a-z0-9-]+)$/)?.[1];
    if (slug) return schoolBy.get(slug) ?? path;
    const id = path.match(/^\/probleme\/([a-z0-9]+)$/)?.[1];
    if (id) return issueBy.get(id) ?? path;
    return path;
  };

  return {
    today: series[29]!,
    yesterday: series[28]!,
    week: { visitors: sum(23, "visitors"), views: sum(23, "views") },
    month: { visitors: sum(0, "visitors"), views: sum(0, "views") },
    series,
    pages: pages.map((p) => ({ path: p.path, label: label(p.path), views: p._sum.views ?? 0 })),
    sources: sources.map((s) => ({ source: s.source, views: s._sum.views ?? 0 })),
    // Arrivées par lien de partage sur 30 jours (une par visiteur et par jour).
    links: SHARE_LINKS.map((l) => ({ ...l, visits: linkVisits.get(l.label) ?? 0 })),
  };
}
