import "server-only";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { isModerationFrozen, isSecondOpinionEnabled, setModerationFrozen, setSecondOpinionEnabled, type SecondOpinionScope } from "../settings";
import { adminLog } from "./log";
import { queueCounts } from "./moderation";
import { limiterKind } from "../rate-limit";

export async function dashboardCounts() {
  const [queue, flagged, openReports, pendingRequests, frozen, secondIssues, secondPress] = await Promise.all([
    queueCounts(),
    prisma.issue.count({ where: { flaggedForReview: true, moderationStatus: { in: ["PUBLISHED", "AUTO_APPROVED"] } } }),
    prisma.contentReport.count({ where: { status: "OPEN" } }),
    prisma.privacyRequest.count({ where: { handled: false } }),
    isModerationFrozen(),
    isSecondOpinionEnabled("issues"),
    isSecondOpinionEnabled("press"),
  ]);
  return {
    limiter: limiterKind(),
    queue: queue.total,
    urgent: queue.urgent,
    flagged,
    openReports,
    pendingRequests,
    frozen,
    frozenByEnv: env().MODERATION_FREEZE,
    secondOpinion: { issues: secondIssues, press: secondPress },
  };
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

export async function setSecondOpinion(adminId: string, scope: SecondOpinionScope, enabled: boolean) {
  const before = await isSecondOpinionEnabled(scope);
  await setSecondOpinionEnabled(scope, enabled);
  await adminLog(prisma, {
    adminId,
    action: enabled ? "SECOND_OPINION_ON" : "SECOND_OPINION_OFF",
    targetType: "AppSetting",
    targetId: scope === "issues" ? "secondOpinionIssues" : "secondOpinionPress",
    before: { enabled: before },
    after: { enabled },
  });
}
