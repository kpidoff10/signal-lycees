// Gestion des signalements (hors file) : liste, fiche, statut, suppression.
import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { IssueCategory, IssueStatus, ModerationStatus } from "@/generated/prisma/enums";
import { AdminError, PAGE_SIZE } from "./forms";
import { adminLog } from "./log";

export interface IssueFilters {
  q: string;
  status?: IssueStatus;
  moderationStatus?: ModerationStatus;
  category?: IssueCategory;
  page: number;
}

export async function listIssues(f: IssueFilters) {
  const where: Prisma.IssueWhereInput = {
    ...(f.status ? { status: f.status } : {}),
    ...(f.moderationStatus ? { moderationStatus: f.moderationStatus } : {}),
    ...(f.category ? { category: f.category } : {}),
    ...(f.q
      ? {
          OR: [
            { title: { contains: f.q, mode: "insensitive" } },
            { school: { name: { contains: f.q, mode: "insensitive" } } },
            { school: { city: { contains: f.q, mode: "insensitive" } } },
            { id: f.q },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.issue.count({ where }),
    prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        moderationStatus: true,
        reviewPriority: true,
        flaggedForReview: true,
        upCount: true,
        downCount: true,
        createdAt: true,
        school: { select: { name: true, city: true } },
      },
    }),
  ]);
  return { total, items, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getIssueDetail(id: string) {
  return prisma.issue.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      originalTitle: true,
      originalDescription: true,
      originalPurgedAt: true,
      category: true,
      status: true,
      moderationStatus: true,
      reviewPriority: true,
      severity: true,
      flaggedForReview: true,
      upCount: true,
      downCount: true,
      resolvedVoteCount: true,
      createdAt: true,
      publishedAt: true,
      statusChangedAt: true,
      resolvedAt: true,
      lastActivityAt: true,
      school: { select: { id: true, name: true, city: true, postalCode: true, slug: true } },
      events: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, type: true, data: true, createdAt: true } },
      decisions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          publicReason: true,
          internalReason: true,
          editedTitle: true,
          createdAt: true,
          admin: { select: { username: true } },
        },
      },
      contentReports: { orderBy: { createdAt: "desc" }, select: { id: true, reason: true, comment: true, status: true, createdAt: true } },
    },
  });
}

/** Changement manuel du statut public. */
export async function setIssueStatus(adminId: string, issueId: string, next: IssueStatus) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const issue = await tx.issue.findUnique({ where: { id: issueId }, select: { status: true, statusChangedAt: true, resolvedAt: true } });
    if (!issue) throw new AdminError("Signalement introuvable.");
    if (issue.status === next) throw new AdminError("Le statut est déjà celui-ci.");
    await tx.issue.update({
      where: { id: issueId },
      data: {
        status: next,
        statusChangedAt: now,
        resolvedAt: next === "RESOLVED" ? now : null,
        events: { create: { type: "STATUS_CHANGED", data: { from: issue.status, to: next } } },
      },
    });
    await adminLog(tx, {
      adminId,
      action: "ISSUE_STATUS",
      targetType: "Issue",
      targetId: issueId,
      before: issue,
      after: { status: next, statusChangedAt: now, resolvedAt: next === "RESOLVED" ? now : null },
    });
  });
}

/** Suppression définitive (ADMIN) : votes, événements, analyses… partent en cascade. */
export async function deleteIssue(adminId: string, issueId: string, context: { reason: string; privacyRequestId?: string }) {
  await prisma.$transaction(async (tx) => {
    const issue = await tx.issue.findUnique({
      where: { id: issueId },
      select: { id: true, schoolId: true, category: true, status: true, moderationStatus: true, createdAt: true, upCount: true },
    });
    if (!issue) throw new AdminError("Signalement introuvable.");
    await tx.issue.delete({ where: { id: issueId } });
    // Aucun texte du signalement n'est conservé dans le journal.
    await adminLog(tx, {
      adminId,
      action: "ISSUE_DELETE",
      targetType: "Issue",
      targetId: issueId,
      before: issue,
      after: { deleted: true, reason: context.reason, privacyRequestId: context.privacyRequestId },
    });
  });
}
