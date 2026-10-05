// Statistiques publiques (/statistiques et ses exports CSV). Agrégats seulement : jamais de classement
// de lycées, jamais de donnée sur un élève.
import "server-only";
import { prisma } from "@/lib/db";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { PUBLIC_ISSUE_WHERE } from "./issues";
import { nationalStats } from "./stats";

/** Début du suivi des mobilisations sur le site (premier jour du mouvement recensé). */
export const MOVEMENT_START = "2026-09-30";

export interface DayCount {
  day: string; // AAAA-MM-JJ
  schools: number;
}

export interface RegionRow {
  region: string;
  activeIssues: number;
  schoolsWithIssues: number;
  mobilizedNow: number;
  mobilizedSinceStart: number;
}

export interface Statistics {
  updatedAt: Date;
  national: Awaited<ReturnType<typeof nationalStats>>;
  bySource: { student: number; press: number };
  mobilizationsByDay: DayCount[];
  byCategory: { id: CategoryId; label: string; emoji: string; count: number }[];
  byRegion: RegionRow[];
}

/** Lycées mobilisés par jour (mobilisations publiées, chaque lycée compté une fois par jour), jours sans mobilisation compris. */
export async function mobilizationsByDay(today: Date): Promise<DayCount[]> {
  const rows = await prisma.$queryRaw<{ day: Date; schools: bigint }[]>`
    SELECT "happenedOn"::date AS day, count(DISTINCT "schoolId") AS schools
      FROM "Mobilization"
     WHERE status = 'PUBLISHED' AND "happenedOn" >= ${new Date(`${MOVEMENT_START}T00:00:00Z`)}
     GROUP BY 1`;
  const counts = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.schools)]));
  const days: DayCount[] = [];
  for (let d = new Date(`${MOVEMENT_START}T00:00:00Z`); d <= today; d = new Date(d.getTime() + 86_400_000)) {
    const key = d.toISOString().slice(0, 10);
    days.push({ day: key, schools: counts.get(key) ?? 0 });
  }
  return days;
}

async function byRegion(now: Date): Promise<RegionRow[]> {
  const rows = await prisma.$queryRaw<
    { region: string; active_issues: bigint; schools_with_issues: bigint; mobilized_now: bigint; mobilized_since_start: bigint }[]
  >`
    SELECT s.region,
           count(DISTINCT i.id) FILTER (WHERE i.id IS NOT NULL) AS active_issues,
           count(DISTINCT i."schoolId") AS schools_with_issues,
           count(DISTINCT m."schoolId") FILTER (WHERE m."expiresAt" > ${now}) AS mobilized_now,
           count(DISTINCT m."schoolId") FILTER (WHERE m."happenedOn" >= ${new Date(`${MOVEMENT_START}T00:00:00Z`)}) AS mobilized_since_start
      FROM "School" s
      LEFT JOIN "Issue" i ON i."schoolId" = s.id AND i."moderationStatus" IN ('PUBLISHED', 'AUTO_APPROVED') AND i.status <> 'RESOLVED'
      LEFT JOIN "Mobilization" m ON m."schoolId" = s.id AND m.status = 'PUBLISHED'
     GROUP BY s.region`;
  return (
    rows
      .map((r) => ({
        region: r.region,
        activeIssues: Number(r.active_issues),
        schoolsWithIssues: Number(r.schools_with_issues),
        mobilizedNow: Number(r.mobilized_now),
        mobilizedSinceStart: Number(r.mobilized_since_start),
      }))
      .filter((r) => r.activeIssues || r.mobilizedSinceStart)
      // Ordre alphabétique : un tableau trié par volume deviendrait un classement.
      .sort((a, b) => a.region.localeCompare(b.region, "fr"))
  );
}

export async function getStatistics(now = new Date()): Promise<Statistics> {
  const [national, sources, days, categories, regions] = await Promise.all([
    nationalStats(),
    prisma.issue.groupBy({ by: ["origin"], where: PUBLIC_ISSUE_WHERE, _count: true }),
    mobilizationsByDay(now),
    prisma.issue.groupBy({
      by: ["category"],
      where: { ...PUBLIC_ISSUE_WHERE, status: { not: "RESOLVED" } },
      _count: true,
    }),
    byRegion(now),
  ]);
  const source = (o: "STUDENT" | "PRESS") => sources.find((s) => s.origin === o)?._count ?? 0;
  return {
    updatedAt: now,
    national,
    bySource: { student: source("STUDENT"), press: source("PRESS") },
    mobilizationsByDay: days,
    byCategory: CATEGORIES.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji, count: categories.find((x) => x.category === c.id)?._count ?? 0 })).sort(
      (a, b) => b.count - a.count,
    ),
    byRegion: regions,
  };
}
