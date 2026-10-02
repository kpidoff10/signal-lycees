import "server-only";
import type { Prisma } from "@/generated/prisma/client";

type Db = Prisma.TransactionClient;

export type LogTarget = "Issue" | "School" | "AnonymousIdentity" | "PrivacyRequest" | "AppSetting" | "AdminUser";
export const LOG_TARGETS: LogTarget[] = ["Issue", "School", "AnonymousIdentity", "PrivacyRequest", "AppSetting", "AdminUser"];

function json(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  // Dates → chaînes ISO, suppression des undefined.
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/** Journal d'administration : à appeler dans la même transaction que la modification. */
export async function adminLog(
  db: Db,
  entry: { adminId: string; action: string; targetType: LogTarget; targetId?: string; before?: unknown; after?: unknown },
) {
  await db.adminLog.create({
    data: {
      adminId: entry.adminId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      before: json(entry.before),
      after: json(entry.after),
    },
  });
}
