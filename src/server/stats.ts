import "server-only";
import { prisma } from "@/lib/db";
import type { CategoryId } from "@/lib/categories";
import { PUBLIC_ISSUE_WHERE } from "./issues";

export interface NationalStats {
  activeIssues: number;
  schoolsConcerned: number;
  confirmations: number;
  resolvedIssues: number;
}

/** Statistiques nationales calculées en base (jamais de classement). */
export async function nationalStats(): Promise<NationalStats> {
  const [active, schools, conf, resolved] = await Promise.all([
    prisma.issue.count({ where: { ...PUBLIC_ISSUE_WHERE, status: { not: "RESOLVED" } } }),
    prisma.issue.findMany({ where: { ...PUBLIC_ISSUE_WHERE, status: { not: "RESOLVED" } }, distinct: ["schoolId"], select: { schoolId: true } }),
    prisma.issue.aggregate({ where: PUBLIC_ISSUE_WHERE, _sum: { upCount: true } }),
    prisma.issue.count({ where: { ...PUBLIC_ISSUE_WHERE, status: "RESOLVED" } }),
  ]);
  return { activeIssues: active, schoolsConcerned: schools.length, confirmations: conf._sum.upCount ?? 0, resolvedIssues: resolved };
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
