// File de modération : lecture et décisions.
import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { IssueCategory, ModerationStatus } from "@/generated/prisma/enums";
import { CATEGORY_IDS } from "@/lib/categories";
import { embed, toVectorLiteral } from "../embeddings";
import { RISK_KEYS, type RiskKey } from "../moderation/jev";
import { adminLog } from "./log";
import { AdminError, PAGE_SIZE } from "./forms";

const PUBLIC_STATUSES: ModerationStatus[] = ["PUBLISHED", "AUTO_APPROVED"];

// Appartenance à la file (même définition que les compteurs du tableau de bord).
const QUEUE_WHERE = Prisma.sql`(
  i."moderationStatus" IN ('MANUAL_REVIEW', 'PENDING')
  OR (i."moderationStatus" IN ('PUBLISHED', 'AUTO_APPROVED') AND i."flaggedForReview")
  OR (i."moderationStatus" <> 'REJECTED' AND EXISTS (
        SELECT 1 FROM "ContentReport" r WHERE r."issueId" = i.id AND r.status = 'OPEN'))
)`;

// Même rang que queueRank() (src/server/admin/queue.ts).
const QUEUE_RANK = Prisma.sql`CASE
  WHEN i."reviewPriority" = 'URGENT' THEN 0
  WHEN i."reviewPriority" = 'ELEVATED' THEN 1
  WHEN i."flaggedForReview" OR EXISTS (
        SELECT 1 FROM "ContentReport" r WHERE r."issueId" = i.id AND r.status = 'OPEN') THEN 2
  ELSE 3 END`;

export async function queueCounts() {
  const [row] = await prisma.$queryRaw<{ total: bigint; urgent: bigint }[]>`
    SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE i."reviewPriority" = 'URGENT') AS urgent
      FROM "Issue" i WHERE ${QUEUE_WHERE}`;
  return { total: Number(row?.total ?? 0), urgent: Number(row?.urgent ?? 0) };
}

/** Résultat d'AIAnalysis, relu avec tolérance (JSON libre en base). */
const analysisResultSchema = z
  .object({
    rules: z
      .array(z.object({ code: z.string(), level: z.string(), match: z.string().optional() }))
      .catch([]),
    risks: z.record(z.string(), z.number()).nullable().catch(null),
    suggestedCategory: z.enum(CATEGORY_IDS).nullable().catch(null),
    categoryConfidence: z.number().nullable().catch(null),
    severity: z.string().nullable().catch(null),
    showHelp: z.boolean().catch(false),
  })
  .partial();

export interface AnalysisView {
  provider: string;
  model: string | null;
  ok: boolean;
  error: string | null;
  reason: string;
  decision: ModerationStatus;
  createdAt: Date;
  risks: { key: RiskKey; value: number }[];
  rules: { code: string; level: string; match?: string }[];
  suggestedCategory: IssueCategory | null;
  categoryConfidence: number | null;
  severity: string | null;
  showHelp: boolean;
}

function toAnalysisView(a: {
  provider: string;
  model: string | null;
  ok: boolean;
  error: string | null;
  reason: string;
  decision: ModerationStatus;
  createdAt: Date;
  result: Prisma.JsonValue;
}): AnalysisView {
  const parsed = analysisResultSchema.safeParse(a.result ?? {});
  const r = parsed.success ? parsed.data : {};
  const risks = RISK_KEYS.filter((k) => typeof r.risks?.[k] === "number").map((k) => ({
    key: k,
    value: Math.min(1, Math.max(0, r.risks![k]!)),
  }));
  return {
    provider: a.provider,
    model: a.model,
    ok: a.ok,
    error: a.error,
    reason: a.reason,
    decision: a.decision,
    createdAt: a.createdAt,
    risks,
    rules: r.rules ?? [],
    suggestedCategory: r.suggestedCategory ?? null,
    categoryConfidence: r.categoryConfidence ?? null,
    severity: r.severity ?? null,
    showHelp: r.showHelp ?? false,
  };
}

export interface SimilarIssue {
  id: string;
  title: string;
  moderationStatus: ModerationStatus;
  upCount: number;
  score: number;
}

/** Problèmes proches du même lycée et de la même catégorie (pg_trgm). */
export async function similarIssues(issue: { id: string; schoolId: string; category: IssueCategory; title: string }) {
  return prisma.$queryRaw<SimilarIssue[]>`
    SELECT id, title, "moderationStatus", "upCount", similarity(title, ${issue.title})::float8 AS score
      FROM "Issue"
     WHERE "schoolId" = ${issue.schoolId}
       AND category = ${issue.category}::"IssueCategory"
       AND id <> ${issue.id}
       AND similarity(title, ${issue.title}) > 0.2
     ORDER BY score DESC
     LIMIT 5`;
}

const queueInclude = {
  school: { select: { name: true, city: true, postalCode: true } },
  analyses: { orderBy: { createdAt: "desc" }, take: 4 },
  contentReports: { where: { status: "OPEN" }, orderBy: { createdAt: "asc" }, select: { id: true, reason: true, comment: true, createdAt: true } },
} satisfies Prisma.IssueInclude;

/** Page de la file, triée par priorité puis ancienneté. */
export async function getQueuePage(page: number) {
  const offset = (page - 1) * PAGE_SIZE;
  const [ranked, counts] = await Promise.all([
    prisma.$queryRaw<{ id: string; rank: number }[]>`
      SELECT i.id, (${QUEUE_RANK})::int AS rank
        FROM "Issue" i
       WHERE ${QUEUE_WHERE}
       ORDER BY rank ASC, i."createdAt" ASC, i.id ASC
       LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
    queueCounts(),
  ]);
  const ids = ranked.map((r) => r.id);
  const issues = await prisma.issue.findMany({ where: { id: { in: ids } }, include: queueInclude });
  const byId = new Map(issues.map((i) => [i.id, i]));
  const items = await Promise.all(
    ranked
      .map((r) => byId.get(r.id))
      .filter((i): i is NonNullable<typeof i> => Boolean(i))
      .map(async (i) => ({
        id: i.id,
        school: i.school,
        category: i.category,
        title: i.title,
        description: i.description,
        originalTitle: i.originalTitle,
        originalDescription: i.originalDescription,
        originalPurgedAt: i.originalPurgedAt,
        moderationStatus: i.moderationStatus,
        reviewPriority: i.reviewPriority,
        status: i.status,
        flaggedForReview: i.flaggedForReview,
        upCount: i.upCount,
        downCount: i.downCount,
        createdAt: i.createdAt,
        publishedAt: i.publishedAt,
        isPublic: PUBLIC_STATUSES.includes(i.moderationStatus),
        // Analyse de Jev (avec les probabilités) et, à part, le second avis GPT s'il y en a eu un.
        analysis: (() => {
          const a = i.analyses.find((x) => x.provider !== "second");
          return a ? toAnalysisView(a) : null;
        })(),
        secondOpinion: (() => {
          const a = i.analyses.find((x) => x.provider === "second");
          return a ? { model: a.model, ok: a.ok, error: a.error, reason: a.reason } : null;
        })(),
        reports: i.contentReports,
        similar: await similarIssues(i),
      })),
  );
  return { items, total: counts.total, urgent: counts.urgent, pageCount: Math.max(1, Math.ceil(counts.total / PAGE_SIZE)) };
}

export type QueueItem = Awaited<ReturnType<typeof getQueuePage>>["items"][number];

// ---------- Décisions ----------

export interface EditInput {
  title: string;
  description: string;
  category: IssueCategory;
}

// Pas de texte libre dans le journal : il peut contenir des données personnelles
// (le texte édité est tracé dans ModerationDecision, purgé avec le signalement).
function snapshot(i: { moderationStatus: ModerationStatus; flaggedForReview: boolean; category: IssueCategory; publishedAt: Date | null }) {
  return {
    moderationStatus: i.moderationStatus,
    flaggedForReview: i.flaggedForReview,
    category: i.category,
    publishedAt: i.publishedAt,
  };
}

async function refreshEmbedding(issueId: string, edit: EditInput) {
  const vector = await embed(`${edit.title}. ${edit.description}`, "document");
  if (vector) await prisma.$executeRaw`UPDATE "Issue" SET embedding = ${toVectorLiteral(vector)}::vector WHERE id = ${issueId}`;
}

/** PUBLIER, ou MODIFIER ET PUBLIER si `edit` est fourni. */
export async function publishIssue(adminId: string, issueId: string, opts: { edit?: EditInput; internalReason?: string }) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const issue = await tx.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new AdminError("Signalement introuvable.");
    const wasPublic = PUBLIC_STATUSES.includes(issue.moderationStatus);
    if (wasPublic && !opts.edit) throw new AdminError("Ce signalement est déjà publié.");

    const updated = await tx.issue.update({
      where: { id: issueId },
      data: {
        moderationStatus: "PUBLISHED",
        publishedAt: issue.publishedAt ?? now,
        flaggedForReview: false,
        downCountAtReview: issue.downCount,
        ...(opts.edit ? { title: opts.edit.title, description: opts.edit.description, category: opts.edit.category } : {}),
      },
    });
    if (!issue.publishedAt) await tx.issueEvent.create({ data: { issueId, type: "PUBLISHED" } });
    // Une version corrigée règle les signalements de contenu ouverts.
    if (opts.edit) {
      await tx.contentReport.updateMany({ where: { issueId, status: "OPEN" }, data: { status: "RESOLVED", handledAt: now } });
    }
    await tx.moderationDecision.create({
      data: {
        issueId,
        adminId,
        fromStatus: issue.moderationStatus,
        toStatus: "PUBLISHED",
        internalReason: opts.internalReason ?? null,
        editedTitle: opts.edit && opts.edit.title !== issue.title ? opts.edit.title : null,
        editedDescription: opts.edit && opts.edit.description !== issue.description ? opts.edit.description : null,
      },
    });
    await adminLog(tx, {
      adminId,
      action: opts.edit ? "ISSUE_EDIT_PUBLISH" : "ISSUE_PUBLISH",
      targetType: "Issue",
      targetId: issueId,
      before: snapshot(issue),
      after: { ...snapshot(updated), textEdited: Boolean(opts.edit && (opts.edit.title !== issue.title || opts.edit.description !== issue.description)) },
    });
  });
  if (opts.edit) await refreshEmbedding(issueId, opts.edit).catch(() => undefined);
}

/** REFUSER (non publié) ou DÉPUBLIER (publié) : motif public obligatoire. */
export async function rejectIssue(adminId: string, issueId: string, opts: { publicReason: string; internalReason?: string }) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const issue = await tx.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new AdminError("Signalement introuvable.");
    if (issue.moderationStatus === "REJECTED") throw new AdminError("Ce signalement est déjà refusé.");
    const wasPublic = PUBLIC_STATUSES.includes(issue.moderationStatus);
    const updated = await tx.issue.update({
      where: { id: issueId },
      data: { moderationStatus: "REJECTED", flaggedForReview: false },
    });
    await tx.contentReport.updateMany({ where: { issueId, status: "OPEN" }, data: { status: "RESOLVED", handledAt: now } });
    await tx.moderationDecision.create({
      data: {
        issueId,
        adminId,
        fromStatus: issue.moderationStatus,
        toStatus: "REJECTED",
        publicReason: opts.publicReason,
        internalReason: opts.internalReason ?? null,
      },
    });
    await adminLog(tx, {
      adminId,
      action: wasPublic ? "ISSUE_UNPUBLISH" : "ISSUE_REJECT",
      targetType: "Issue",
      targetId: issueId,
      before: snapshot(issue),
      after: { ...snapshot(updated), publicReason: opts.publicReason },
    });
  });
}

/** Problème publié signalé : « Laisser publié ». */
export async function keepPublished(adminId: string, issueId: string, opts: { internalReason?: string }) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const issue = await tx.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new AdminError("Signalement introuvable.");
    if (!PUBLIC_STATUSES.includes(issue.moderationStatus)) throw new AdminError("Ce signalement n'est pas publié.");
    const updated = await tx.issue.update({ where: { id: issueId }, data: { flaggedForReview: false, downCountAtReview: issue.downCount } });
    const dismissed = await tx.contentReport.updateMany({
      where: { issueId, status: "OPEN" },
      data: { status: "DISMISSED", handledAt: now },
    });
    await tx.moderationDecision.create({
      data: {
        issueId,
        adminId,
        fromStatus: issue.moderationStatus,
        toStatus: issue.moderationStatus,
        internalReason: opts.internalReason ?? null,
      },
    });
    await adminLog(tx, {
      adminId,
      action: "ISSUE_KEEP_PUBLISHED",
      targetType: "Issue",
      targetId: issueId,
      before: snapshot(issue),
      after: { ...snapshot(updated), dismissedReports: dismissed.count },
    });
  });
}
