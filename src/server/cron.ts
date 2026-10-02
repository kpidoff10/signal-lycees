import "server-only";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { safeEqual } from "./crypto";
import { refreshStatus } from "./issues";
import { purgeVisitorHashes } from "./traffic";

/** Les tâches planifiées Vercel Cron envoient « Authorization: Bearer <CRON_SECRET> ». */
export function isCronAuthorized(req: Request): boolean {
  const secret = env().CRON_SECRET;
  if (!secret) return false;
  return safeEqual(req.headers.get("authorization") ?? "", `Bearer ${secret}`);
}

/** Recalcule les statuts (passage automatique en RESOLVED après 21 jours sans confirmation). */
export async function runStatusJob(now = new Date()) {
  const issues = await prisma.issue.findMany({
    where: { status: { in: ["ACTIVE", "POSSIBLY_RESOLVED"] }, moderationStatus: { in: ["PUBLISHED", "AUTO_APPROVED"] } },
    select: { id: true, status: true },
  });
  let changed = 0;
  for (const i of issues) {
    const next = await refreshStatus(i.id, now);
    if (next && next !== i.status) changed++;
  }
  return { checked: issues.length, changed };
}

export const RETENTION = {
  /** Texte original saisi : purgé 90 jours après la décision de modération. */
  originalTextDays: 90,
  /** Identités anonymes inactives. */
  identityDays: 365,
  /** Analyses automatiques. */
  analysisDays: 365,
  /** Signalements de contenu et demandes traités. */
  handledReportsDays: 365,
};

const days = (n: number, now: Date) => new Date(now.getTime() - n * 86_400_000);

/** Purge des données selon la politique de conservation (voir /confidentialite). */
export async function runPurgeJob(now = new Date()) {
  const textCutoff = days(RETENTION.originalTextDays, now);
  const purgedText = await prisma.issue.updateMany({
    where: {
      originalPurgedAt: null,
      moderationStatus: { in: ["PUBLISHED", "AUTO_APPROVED", "REJECTED"] },
      OR: [{ publishedAt: { lt: textCutoff } }, { moderationStatus: "REJECTED", updatedAt: { lt: textCutoff } }],
    },
    data: { originalTitle: null, originalDescription: null, originalPurgedAt: now },
  });
  // Les textes modifiés par la modération suivent la même règle.
  const purgedEdits = await prisma.moderationDecision.updateMany({
    where: { createdAt: { lt: textCutoff }, OR: [{ editedTitle: { not: null } }, { editedDescription: { not: null } }] },
    data: { editedTitle: null, editedDescription: null },
  });
  const identities = await prisma.anonymousIdentity.deleteMany({ where: { lastSeen: { lt: days(RETENTION.identityDays, now) }, banned: false } });
  const analyses = await prisma.aIAnalysis.deleteMany({ where: { createdAt: { lt: days(RETENTION.analysisDays, now) } } });
  const reports = await prisma.contentReport.deleteMany({ where: { status: { not: "OPEN" }, handledAt: { lt: days(RETENTION.handledReportsDays, now) } } });
  const visitorHashes = await purgeVisitorHashes();
  const requests = await prisma.privacyRequest.deleteMany({ where: { handled: true, createdAt: { lt: days(RETENTION.handledReportsDays, now) } } });
  return {
    purgedText: purgedText.count,
    purgedEdits: purgedEdits.count,
    identities: identities.count,
    analyses: analyses.count,
    reports: reports.count,
    requests: requests.count,
    visitorHashes,
  };
}
