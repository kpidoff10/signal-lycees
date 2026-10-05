import "server-only";
import { prisma } from "@/lib/db";
import type { CategoryId } from "@/lib/categories";
import { PUBLIC_ISSUE_WHERE } from "./issues";
import { activeWhere } from "./mobilizations";

export interface NationalStats {
  activeIssues: number;
  /** Lycées où une mobilisation est en cours (affichée sur la carte). */
  activeMobilizations: number;
  /** Lycées avec un problème actif ou une mobilisation en cours. */
  schoolsConcerned: number;
  confirmations: number;
  resolvedIssues: number;
}

/** Statistiques nationales calculées en base (jamais de classement). */
export async function nationalStats(): Promise<NationalStats> {
  const [active, schools, mobilized, conf, resolved] = await Promise.all([
    prisma.issue.count({ where: { ...PUBLIC_ISSUE_WHERE, status: { not: "RESOLVED" } } }),
    prisma.issue.findMany({ where: { ...PUBLIC_ISSUE_WHERE, status: { not: "RESOLVED" } }, distinct: ["schoolId"], select: { schoolId: true } }),
    prisma.mobilization.findMany({ where: activeWhere(), distinct: ["schoolId"], select: { schoolId: true } }),
    prisma.issue.aggregate({ where: PUBLIC_ISSUE_WHERE, _sum: { upCount: true } }),
    prisma.issue.count({ where: { ...PUBLIC_ISSUE_WHERE, status: "RESOLVED" } }),
  ]);
  const concerned = new Set([...schools, ...mobilized].map((s) => s.schoolId));
  return { activeIssues: active, activeMobilizations: mobilized.length, schoolsConcerned: concerned.size, confirmations: conf._sum.upCount ?? 0, resolvedIssues: resolved };
}

export interface TodayActivity {
  newIssues: number;
  confirmationsLastHour: number;
  confirmationsToday: number;
  resolvedToday: number;
}

export async function todayActivity(now = new Date()): Promise<TodayActivity> {
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  const hour = new Date(now.getTime() - 3600_000);
  const publicIssue = { issue: PUBLIC_ISSUE_WHERE };
  const [newIssues, lastHour, today, resolved] = await Promise.all([
    prisma.issue.count({ where: { ...PUBLIC_ISSUE_WHERE, publishedAt: { gte: day } } }),
    prisma.issueVote.count({ where: { value: "UP", updatedAt: { gte: hour }, ...publicIssue } }),
    prisma.issueVote.count({ where: { value: "UP", updatedAt: { gte: day }, ...publicIssue } }),
    prisma.issueStatusVote.count({ where: { createdAt: { gte: day }, ...publicIssue } }),
  ]);
  return { newIssues, confirmationsLastHour: lastHour, confirmationsToday: today, resolvedToday: resolved };
}

export interface HighlightIssue {
  id: string;
  title: string;
  category: CategoryId;
  upCount: number;
  createdAt: Date;
  status: string;
  school: { name: string; city: string; slug: string };
}

/** Exemples pour le hero : un problème très confirmé et un problème résolu récemment. */
export async function heroHighlights(): Promise<{ top: HighlightIssue | null; resolved: HighlightIssue | null }> {
  const select = {
    id: true,
    title: true,
    category: true,
    upCount: true,
    createdAt: true,
    status: true,
    school: { select: { name: true, city: true, slug: true } },
  } as const;
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [top, resolved] = await Promise.all([
    prisma.issue.findFirst({
      where: { ...PUBLIC_ISSUE_WHERE, status: "ACTIVE", lastActivityAt: { gte: since }, flaggedForReview: false, origin: "STUDENT" },
      orderBy: { upCount: "desc" },
      select,
    }),
    prisma.issue.findFirst({ where: { ...PUBLIC_ISSUE_WHERE, status: "RESOLVED" }, orderBy: { resolvedAt: "desc" }, select }),
  ]);
  return { top, resolved };
}

export interface LatestIssue {
  id: string;
  title: string;
  category: CategoryId;
  city: string;
  publishedAt: Date;
  upCount: number;
  press: boolean;
}

/** Derniers signalements publiés, pour l'accueil : la ville seulement, jamais le lycée. */
export async function latestIssues(limit = 4): Promise<LatestIssue[]> {
  const rows = await prisma.issue.findMany({
    where: { ...PUBLIC_ISSUE_WHERE, flaggedForReview: false, status: { not: "RESOLVED" } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: { id: true, title: true, category: true, publishedAt: true, createdAt: true, upCount: true, origin: true, school: { select: { city: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    city: r.school.city,
    publishedAt: r.publishedAt ?? r.createdAt,
    upCount: r.upCount,
    press: r.origin === "PRESS",
  }));
}
