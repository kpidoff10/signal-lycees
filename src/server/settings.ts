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

export type SecondOpinionScope = "issues" | "press" | "mobilizations" | "verification";
export const SECOND_OPINION_KEYS: Record<SecondOpinionScope, string> = {
  issues: "secondOpinionIssues",
  press: "secondOpinionPress",
  mobilizations: "secondOpinionMobilizations",
  verification: "secondOpinionVerification",
};

/** Second avis GPT (actif par défaut) : désactivable depuis le tableau de bord. */
export async function isSecondOpinionEnabled(scope: SecondOpinionScope): Promise<boolean> {
  const s = await prisma.appSetting.findUnique({ where: { key: SECOND_OPINION_KEYS[scope] } });
  return s?.value !== false;
}

export async function setSecondOpinionEnabled(scope: SecondOpinionScope, enabled: boolean) {
  const key = SECOND_OPINION_KEYS[scope];
  await prisma.appSetting.upsert({ where: { key }, create: { key, value: enabled }, update: { value: enabled } });
}
