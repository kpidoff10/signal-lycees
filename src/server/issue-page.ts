import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { buildTimeline } from "@/lib/timeline";
import { PUBLIC_ISSUE_WHERE } from "./issues";

export const getPublicIssue = cache(async (id: string) => {
  if (!/^[a-z0-9]{10,40}$/.test(id)) return null;
  const issue = await prisma.issue.findFirst({
    where: { id, ...PUBLIC_ISSUE_WHERE },
    select: {
      id: true,
      category: true,
      title: true,
      description: true,
      status: true,
      upCount: true,
      resolvedVoteCount: true,
      createdAt: true,
      lastActivityAt: true,
      school: { select: { id: true, slug: true, name: true, city: true, postalCode: true } },
      events: { select: { type: true, data: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      dailyStats: { select: { day: true, upTotal: true, resolvedTotal: true }, orderBy: { day: "asc" } },
    },
  });
  if (!issue) return null;
  const { events, dailyStats, ...rest } = issue;
  return { ...rest, timeline: buildTimeline({ createdAt: issue.createdAt, events, daily: dailyStats }) };
});
