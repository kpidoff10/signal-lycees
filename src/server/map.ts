import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { CategoryId } from "@/lib/categories";
import { periodStart, type MapFilters } from "@/lib/map-filters";

/** Point de carte : un lycée (jamais un point par signalement). */
export interface MapSchool {
  id: string;
  slug: string;
  name: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  /** Signalements correspondant aux filtres (taille du marqueur). */
  count: number;
  active: number;
  confirmations: number;
  dominant: CategoryId;
}

export async function mapSchools(f: MapFilters): Promise<MapSchool[]> {
  const since = periodStart(f.period);
  const conditions: Prisma.Sql[] = [Prisma.sql`i."moderationStatus" IN ('PUBLISHED', 'AUTO_APPROVED')`];
  if (f.cats.length) conditions.push(Prisma.sql`i.category::text IN (${Prisma.join(f.cats)})`);
  if (since) conditions.push(Prisma.sql`i."createdAt" >= ${since}`);
  if (f.activeOnly) conditions.push(Prisma.sql`i.status <> 'RESOLVED'`);

  const rows = await prisma.$queryRaw<
    { id: string; slug: string; name: string; city: string; region: string; lat: number; lng: number; count: bigint; active: bigint; confirmations: bigint | null; dominant: CategoryId }[]
  >`
    SELECT s.id, s.slug, s.name, s.city, s.region, s.latitude AS lat, s.longitude AS lng,
           COUNT(*) AS count,
           COUNT(*) FILTER (WHERE i.status <> 'RESOLVED') AS active,
           SUM(i."upCount") AS confirmations,
           MODE() WITHIN GROUP (ORDER BY i.category) AS dominant
      FROM "Issue" i
      JOIN "School" s ON s.id = i."schoolId"
     WHERE ${Prisma.join(conditions, " AND ")}
     GROUP BY s.id`;
  return rows.map((r) => ({
    ...r,
    count: Number(r.count),
    active: Number(r.active),
    confirmations: Number(r.confirmations ?? 0),
  }));
}

export interface MapSchoolDetail {
  id: string;
  slug: string;
  name: string;
  city: string;
  postalCode: string;
  active: number;
  confirmations: number;
  categories: { id: CategoryId; count: number }[];
  top: { id: string; title: string; category: CategoryId; upCount: number } | null;
}

export async function mapSchoolDetail(id: string): Promise<MapSchoolDetail | null> {
  const school = await prisma.school.findUnique({ where: { id }, select: { id: true, slug: true, name: true, city: true, postalCode: true } });
  if (!school) return null;
  const where = { schoolId: id, moderationStatus: { in: ["PUBLISHED" as const, "AUTO_APPROVED" as const] }, status: { not: "RESOLVED" as const } };
  const [groups, conf, top] = await Promise.all([
    prisma.issue.groupBy({ by: ["category"], where, _count: { _all: true } }),
    prisma.issue.aggregate({ where: { ...where, status: undefined }, _sum: { upCount: true } }),
    prisma.issue.findFirst({ where: { ...where, flaggedForReview: false }, orderBy: { upCount: "desc" }, select: { id: true, title: true, category: true, upCount: true } }),
  ]);
  const categories = groups.map((g) => ({ id: g.category, count: g._count._all })).sort((a, b) => b.count - a.count);
  return {
    ...school,
    active: categories.reduce((s, c) => s + c.count, 0),
    confirmations: conf._sum.upCount ?? 0,
    categories,
    top,
  };
}
