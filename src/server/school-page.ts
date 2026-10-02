import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { CategoryId } from "@/lib/categories";
import { PUBLIC_ISSUE_WHERE } from "./issues";

export interface IssueListItem {
  id: string;
  category: CategoryId;
  title: string;
  status: "ACTIVE" | "POSSIBLY_RESOLVED" | "RESOLVED";
  upCount: number;
  downCount: number;
  createdAt: string;
  lastActivityAt: string;
  resolvedAt: string | null;
  source: { name: string; url: string; date: string | null } | null;
}

export const getSchoolBySlug = cache(async (slug: string) =>
  prisma.school.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, type: true, sector: true, address: true, postalCode: true, city: true, department: true, region: true, academy: true, latitude: true, longitude: true, isOpen: true },
  }),
);

export async function getSchoolIssues(schoolId: string): Promise<IssueListItem[]> {
  const issues = await prisma.issue.findMany({
    where: { schoolId, ...PUBLIC_ISSUE_WHERE },
    select: {
      id: true, category: true, title: true, status: true, upCount: true, downCount: true, createdAt: true, lastActivityAt: true, resolvedAt: true,
      origin: true, sourceName: true, sourceUrl: true, sourceDate: true,
    },
    orderBy: { upCount: "desc" },
    take: 500,
  });
  return issues.map(({ origin, sourceName, sourceUrl, sourceDate, ...i }) => ({
    ...i,
    source: origin === "PRESS" && sourceName && sourceUrl ? { name: sourceName, url: sourceUrl, date: sourceDate?.toISOString() ?? null } : null,
    createdAt: i.createdAt.toISOString(),
    lastActivityAt: i.lastActivityAt.toISOString(),
    resolvedAt: i.resolvedAt?.toISOString() ?? null,
  }));
}

