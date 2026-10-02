"use server";

import { z } from "zod";
import { happenedOnFromChoice } from "@/lib/mobilization";
import { cleanUserText } from "@/lib/text";
import { PARTICIPANT_ERRORS, requireParticipant } from "@/server/identity";
import { reportMobilization } from "@/server/mobilizations";
import { rateLimit } from "@/server/rate-limit";

const input = z.object({
  schoolId: z.string().min(1).max(40),
  when: z.enum(["today", "yesterday", "2days"]),
  reasons: z.string().transform(cleanUserText).pipe(z.string().max(200, "200 caractères maximum.")).optional(),
  turnstileToken: z.string().max(4096).nullish(),
});

/** « Signaler une mobilisation » : visible seulement après validation par la modération. */
export async function reportMobilizationAction(raw: unknown): Promise<{ ok: true; status: string } | { ok: false; error: string; code?: string }> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Requête invalide." };
  const participant = await requireParticipant(parsed.data.turnstileToken);
  if (!participant.ok) return { ok: false, error: PARTICIPANT_ERRORS[participant.error], code: participant.error };
  const limit = await rateLimit("report", participant.identityId);
  if (!limit.ok) return { ok: false, error: "Trop de signalements en peu de temps. Réessaie plus tard." };
  return reportMobilization({
    identityId: participant.identityId,
    schoolId: parsed.data.schoolId,
    happenedOn: happenedOnFromChoice(parsed.data.when),
    reasons: parsed.data.reasons,
  });
}
