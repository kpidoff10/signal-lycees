// Demandes de suppression / contact (RGPD, DSA).
import "server-only";
import { prisma } from "@/lib/db";
import { AdminError, PAGE_SIZE } from "./forms";
import { deleteIssue } from "./issues";
import { adminLog } from "./log";

export async function listRequests(f: { page: number; handled?: boolean }) {
  const where = f.handled === undefined ? {} : { handled: f.handled };
  const [total, items] = await Promise.all([
    prisma.privacyRequest.count({ where }),
    prisma.privacyRequest.findMany({ where, orderBy: { createdAt: "asc" }, skip: (f.page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);
  const issueIds = [...new Set(items.map((r) => r.issueId).filter((x): x is string => Boolean(x)))];
  const issues = issueIds.length
    ? await prisma.issue.findMany({
        where: { id: { in: issueIds } },
        select: { id: true, title: true, moderationStatus: true, school: { select: { name: true } } },
      })
    : [];
  const byId = new Map(issues.map((i) => [i.id, i]));
  return {
    total,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    items: items.map((r) => ({ ...r, issue: r.issueId ? (byId.get(r.issueId) ?? null) : null })),
  };
}

export async function markHandled(adminId: string, requestId: string, handled: boolean) {
  await prisma.$transaction(async (tx) => {
    const req = await tx.privacyRequest.findUnique({ where: { id: requestId }, select: { handled: true, kind: true } });
    if (!req) throw new AdminError("Demande introuvable.");
    await tx.privacyRequest.update({ where: { id: requestId }, data: { handled } });
    await adminLog(tx, {
      adminId,
      action: handled ? "REQUEST_HANDLED" : "REQUEST_REOPENED",
      targetType: "PrivacyRequest",
      targetId: requestId,
      before: { handled: req.handled },
      after: { handled },
    });
  });
}

/** Supprime le signalement visé par une demande de suppression, puis la marque traitée. */
export async function deleteRequestedIssue(adminId: string, requestId: string) {
  const req = await prisma.privacyRequest.findUnique({ where: { id: requestId } });
  if (!req) throw new AdminError("Demande introuvable.");
  if (req.kind !== "DELETION" || !req.issueId) throw new AdminError("Cette demande ne vise aucun signalement.");
  const exists = await prisma.issue.findUnique({ where: { id: req.issueId }, select: { id: true } });
  if (exists) await deleteIssue(adminId, req.issueId, { reason: "Demande de suppression", privacyRequestId: requestId });
  if (!req.handled) await markHandled(adminId, requestId, true);
}
