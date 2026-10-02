import "server-only";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

/** Interrupteur d'urgence : variable d'environnement OU réglage admin. */
export async function isModerationFrozen(): Promise<boolean> {
  if (env().MODERATION_FREEZE) return true;
  const s = await prisma.appSetting.findUnique({ where: { key: "moderationFreeze" } });
  return s?.value === true;
}

export async function setModerationFrozen(frozen: boolean) {
  await prisma.appSetting.upsert({
    where: { key: "moderationFreeze" },
    create: { key: "moderationFreeze", value: frozen },
    update: { value: frozen },
  });
}
