import "server-only";
import { prisma } from "@/lib/db";
import type { IssueDraft } from "@/lib/schemas";
import type { Prisma } from "@/generated/prisma/client";
import { randomToken, sha256 } from "./crypto";
import { embed, toVectorLiteral } from "./embeddings";
import { moderate } from "./moderation/pipeline";
import { isEligibleForSecondOpinion } from "./moderation/second-decide";
import { resolveWithSecondOpinion } from "./moderation/second";
import { after } from "next/server";
import { isSecondOpinionEnabled } from "./settings";
import { crossedMilestone, needsDownvoteReview, nextStatus, STATUS_RULES } from "./status";
import { notify } from "./notify";

export interface CreatedIssue {
  issueId: string;
  trackingToken: string;
  status: "PUBLISHED" | "MANUAL_REVIEW" | "REJECTED";
  showHelp: boolean;
  publicReason?: string;
}

/** Crée un signalement : modération (règles + Jev), embedding, événements. */
export async function createIssue(draft: IssueDraft, authorId: string): Promise<CreatedIssue> {
  const school = await prisma.school.findUnique({ where: { id: draft.schoolId }, select: { id: true } });
  if (!school) throw new Error("Lycée introuvable");

  const [outcome, vector] = await Promise.all([
    moderate(draft),
    embed(`${draft.title}. ${draft.description}`),
  ]);

  const trackingToken = randomToken(24);
  const published = outcome.decision === "AUTO_APPROVED";
  const moderationStatus = published ? "PUBLISHED" : outcome.decision;
  const now = new Date();

  const issue = await prisma.$transaction(async (tx) => {
    const created = await tx.issue.create({
      data: {
        schoolId: draft.schoolId,
        authorId,
        category: draft.category,
        title: draft.title,
        description: draft.description,
        originalTitle: draft.title,
        originalDescription: draft.description,
        moderationStatus,
        reviewPriority: outcome.priority,
        severity: outcome.jev?.severity ?? null,
        trackingTokenHash: sha256(trackingToken),
        publishedAt: published ? now : null,
        // L'auteur rencontre le problème : sa confirmation compte.
        upCount: 1,
        votes: { create: { identityId: authorId, value: "UP" } },
        events: {
          create: [{ type: "CREATED" }, ...(published ? [{ type: "PUBLISHED" as const }] : [])],
        },
        analyses: {
          create: {
            provider: outcome.provider,
            model: outcome.jev?.model ?? null,
            ok: outcome.jev !== null,
            error: outcome.jevError ?? null,
            result: {
              rules: outcome.rules.map((r) => ({ code: r.code, level: r.level, match: r.match })),
              risks: outcome.jev?.risks ?? null,
              suggestedCategory: outcome.jev?.category ?? null,
              categoryConfidence: outcome.jev?.categoryConfidence ?? null,
              severity: outcome.jev?.severity ?? null,
              flags: outcome.flags,
              showHelp: outcome.showHelp,
            } as Prisma.InputJsonValue,
            decision: moderationStatus,
            reason: outcome.reason,
            latencyMs: outcome.latencyMs,
          },
        },
      },
    });
    if (outcome.decision === "REJECTED" && outcome.publicReason) {
      await tx.moderationDecision.create({
        data: { issueId: created.id, fromStatus: "PENDING", toStatus: "REJECTED", publicReason: outcome.publicReason, internalReason: "Refus automatique" },
      });
    }
    return created;
  });

  if (vector) {
    await prisma.$executeRawUnsafe(`UPDATE "Issue" SET embedding = $1::vector WHERE id = $2`, toVectorLiteral(vector), issue.id);
  }
  await recordDailyStat(issue.id);
  // Jev hésite : second avis après la réponse ; la modération n'est prévenue que s'il doute aussi.
  if (isEligibleForSecondOpinion(outcome, outcome.jev, outcome.rules) && (await isSecondOpinionEnabled("issues"))) {
    after(() => resolveWithSecondOpinion(issue.id, draft, outcome));
  } else {
    notify({
      type: "issue",
      issueId: issue.id,
      status: moderationStatus === "PUBLISHED" ? "PUBLISHED" : moderationStatus === "REJECTED" ? "REJECTED" : "MANUAL_REVIEW",
      priority: outcome.priority,
      showHelp: outcome.showHelp,
    });
  }

  return {
    issueId: issue.id,
    trackingToken,
    status: moderationStatus === "PUBLISHED" ? "PUBLISHED" : moderationStatus === "REJECTED" ? "REJECTED" : "MANUAL_REVIEW",
    showHelp: outcome.showHelp,
    publicReason: outcome.publicReason,
  };
}

function startOfUtcDay(d = new Date()) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/** Cumul du jour pour la timeline. */
export async function recordDailyStat(issueId: string) {
  const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { upCount: true, resolvedVoteCount: true } });
  if (!issue) return;
  const day = startOfUtcDay();
  await prisma.issueDailyStat.upsert({
    where: { issueId_day: { issueId, day } },
    create: { issueId, day, upTotal: issue.upCount, resolvedTotal: issue.resolvedVoteCount },
    update: { upTotal: issue.upCount, resolvedTotal: issue.resolvedVoteCount },
  });
}

export const PUBLIC_ISSUE_WHERE = { moderationStatus: { in: ["PUBLISHED" as const, "AUTO_APPROVED" as const] } };

export type VoteChoice = "UP" | "DOWN" | "NONE";

/** 👍 / 👎 : un vote par identité, modifiable et annulable. */
export async function castVote(issueId: string, identityId: string, choice: VoteChoice) {
  const result = await prisma.$transaction(async (tx) => {
    const issue = await tx.issue.findFirst({
      where: { id: issueId, ...PUBLIC_ISSUE_WHERE },
      select: { id: true, upCount: true, downCount: true, downCountAtReview: true, status: true, flaggedForReview: true },
    });
    if (!issue) return null;
    const existing = await tx.issueVote.findUnique({ where: { issueId_identityId: { issueId, identityId } } });
    const before = existing?.value ?? "NONE";
    if (before === choice) return { up: issue.upCount, down: issue.downCount, before: issue.upCount, choice };

    let du = 0;
    let dd = 0;
    if (before === "UP") du--;
    if (before === "DOWN") dd--;
    if (choice === "UP") du++;
    if (choice === "DOWN") dd++;

    if (choice === "NONE") await tx.issueVote.delete({ where: { issueId_identityId: { issueId, identityId } } });
    else
      await tx.issueVote.upsert({
        where: { issueId_identityId: { issueId, identityId } },
        create: { issueId, identityId, value: choice },
        update: { value: choice },
      });

    const updated = await tx.issue.update({
      where: { id: issueId },
      data: {
        upCount: { increment: du },
        downCount: { increment: dd },
        ...(choice === "UP" ? { lastActivityAt: new Date() } : {}),
      },
      select: { upCount: true, downCount: true },
    });

    // Seuls les 👎 arrivés depuis la dernière revue humaine comptent.
    let newlyFlagged = false;
    if (needsDownvoteReview(updated.upCount, updated.downCount - issue.downCountAtReview)) {
      await tx.issue.update({ where: { id: issueId }, data: { flaggedForReview: true } });
      newlyFlagged = !issue.flaggedForReview;
    }
    const milestone = crossedMilestone(issue.upCount, updated.upCount);
    if (milestone) await tx.issueEvent.create({ data: { issueId, type: "CONFIRMATION_MILESTONE", data: { count: milestone } } });

    return { up: updated.upCount, down: updated.downCount, before: issue.upCount, choice, newlyFlagged };
  });
  if (!result) return null;
  if (result.newlyFlagged) notify({ type: "downvotes", issueId });
  await recordDailyStat(issueId);
  await refreshStatus(issueId);
  return { upCount: result.up, myVote: result.choice };
}

/** « Le problème semble résolu » : un vote par identité. */
export async function voteResolved(issueId: string, identityId: string) {
  const issue = await prisma.issue.findFirst({ where: { id: issueId, ...PUBLIC_ISSUE_WHERE }, select: { id: true } });
  if (!issue) return null;
  const created = await prisma.issueStatusVote
    .create({ data: { issueId, identityId } })
    .then(() => true)
    .catch(() => false); // déjà voté (contrainte unique)
  if (created) {
    await prisma.issue.update({ where: { id: issueId }, data: { resolvedVoteCount: { increment: 1 }, lastActivityAt: new Date() } });
    await recordDailyStat(issueId);
    await refreshStatus(issueId);
  }
  return { alreadyVoted: !created };
}

/** Recalcule le statut public d'après les votes récents (voir status.ts). */
export async function refreshStatus(issueId: string, now = new Date()) {
  const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { status: true, statusChangedAt: true } });
  if (!issue || issue.status === "RESOLVED") return issue?.status;
  const since = new Date(now.getTime() - STATUS_RULES.windowDays * 86_400_000);
  const [recentUp, recentResolved, upSinceStatusChange] = await Promise.all([
    prisma.issueVote.count({ where: { issueId, value: "UP", updatedAt: { gte: since } } }),
    prisma.issueStatusVote.count({ where: { issueId, createdAt: { gte: since } } }),
    prisma.issueVote.count({ where: { issueId, value: "UP", updatedAt: { gt: issue.statusChangedAt } } }),
  ]);
  const next = nextStatus({ status: issue.status, statusChangedAt: issue.statusChangedAt, recentUp, recentResolved, upSinceStatusChange, now });
  if (next !== issue.status) {
    await prisma.issue.update({
      where: { id: issueId },
      data: {
        status: next,
        statusChangedAt: now,
        resolvedAt: next === "RESOLVED" ? now : null,
        events: { create: { type: "STATUS_CHANGED", data: { from: issue.status, to: next } } },
      },
    });
  }
  return next;
}
