import "server-only";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { isModerationFrozen, setModerationFrozen } from "../settings";
import { adminLog } from "./log";
import { queueCounts } from "./moderation";
import { limiterKind } from "../rate-limit";

export async function dashboardCounts() {
  const [queue, flagged, openReports, pendingRequests, frozen] = await Promise.all([
    queueCounts(),
    prisma.issue.count({ where: { flaggedForReview: true, moderationStatus: { in: ["PUBLISHED", "AUTO_APPROVED"] } } }),
    prisma.contentReport.count({ where: { status: "OPEN" } }),
    prisma.privacyRequest.count({ where: { handled: false } }),
    isModerationFrozen(),
  ]);
  return { limiter: limiterKind(), queue: queue.total, urgent: queue.urgent, flagged, openReports, pendingRequests, frozen, frozenByEnv: env().MODERATION_FREEZE };
}

export async function setFreeze(adminId: string, frozen: boolean) {
  const before = await isModerationFrozen();
  await setModerationFrozen(frozen);
  await adminLog(prisma, {
    adminId,
    action: frozen ? "FREEZE_ON" : "FREEZE_OFF",
    targetType: "AppSetting",
    targetId: "moderationFreeze",
    before: { frozen: before },
    after: { frozen },
  });
}
