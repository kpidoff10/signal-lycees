"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { contentReportSchema, issueDraftSchema } from "@/lib/schemas";
import { sha256 } from "@/server/crypto";
import { findDuplicates } from "@/server/duplicates";
import { embed } from "@/server/embeddings";
import { PARTICIPANT_ERRORS, requireParticipant } from "@/server/identity";
import { castVote, createIssue, voteResolved } from "@/server/issues";
import { rateLimit } from "@/server/rate-limit";
import { clientIp, ipFingerprint } from "@/server/request";
import { verifyTurnstile } from "@/server/turnstile";

type Fail = { ok: false; error: string };

const RATE_LIMITED = "Trop d’actions en peu de temps. Réessaie un peu plus tard.";
const GENERIC = "Une erreur est survenue. Réessaie dans un instant.";

const voteInput = z.object({
  issueId: z.string().min(1).max(40),
  choice: z.enum(["UP", "DOWN", "NONE"]),
  turnstileToken: z.string().max(4096).nullish(),
});

/** 👍 « Je rencontre aussi ce problème », 👎 « pas sérieux », ou annulation. */
export async function voteAction(input: z.input<typeof voteInput>): Promise<{ ok: true; upCount: number; myVote: string } | Fail> {
  const parsed = voteInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC };
  const participant = await requireParticipant(parsed.data.turnstileToken);
  if (!participant.ok) return { ok: false, error: PARTICIPANT_ERRORS[participant.error] };
  const [byIdentity, byIp] = await Promise.all([rateLimit("vote", participant.identityId), rateLimit("voteIp", participant.ipKey)]);
  if (!byIdentity.ok || !byIp.ok) return { ok: false, error: RATE_LIMITED };
  try {
    const r = await castVote(parsed.data.issueId, participant.identityId, parsed.data.choice);
    if (!r) return { ok: false, error: "Ce problème n’est plus disponible." };
    revalidatePath(`/probleme/${parsed.data.issueId}`);
    return { ok: true, upCount: r.upCount, myVote: r.myVote };
  } catch {
    return { ok: false, error: GENERIC };
  }
}

const resolvedInput = z.object({ issueId: z.string().min(1).max(40), turnstileToken: z.string().max(4096).nullish() });

/** « Le problème semble résolu ». */
export async function resolvedAction(input: z.input<typeof resolvedInput>): Promise<{ ok: true; alreadyVoted: boolean } | Fail> {
  const parsed = resolvedInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC };
  const participant = await requireParticipant(parsed.data.turnstileToken);
  if (!participant.ok) return { ok: false, error: PARTICIPANT_ERRORS[participant.error] };
  const [byIdentity, byIp] = await Promise.all([rateLimit("vote", participant.identityId), rateLimit("voteIp", participant.ipKey)]);
  if (!byIdentity.ok || !byIp.ok) return { ok: false, error: RATE_LIMITED };
  try {
    const r = await voteResolved(parsed.data.issueId, participant.identityId);
    if (!r) return { ok: false, error: "Ce problème n’est plus disponible." };
    revalidatePath(`/probleme/${parsed.data.issueId}`);
    return { ok: true, alreadyVoted: r.alreadyVoted };
  } catch {
    return { ok: false, error: GENERIC };
  }
}

const draftWithToken = issueDraftSchema.extend({ turnstileToken: z.string().max(4096).nullish() });

export interface DuplicateView {
  id: string;
  title: string;
  description: string;
  upCount: number;
  createdAt: string;
}

/** Étape « doublons » : problèmes proches déjà publiés dans le même lycée et la même catégorie. */
export async function checkDuplicatesAction(input: unknown): Promise<{ ok: true; duplicates: DuplicateView[] } | Fail> {
  const parsed = issueDraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? GENERIC };
  const limit = await rateLimit("search", await ipFingerprint());
  if (!limit.ok) return { ok: false, error: RATE_LIMITED };
  try {
    const vector = await embed(`${parsed.data.title}. ${parsed.data.description}`, "query");
    const dups = await findDuplicates({ ...parsed.data, vector });
    return {
      ok: true,
      duplicates: dups.map((d) => ({ id: d.id, title: d.title, description: d.description.slice(0, 280), upCount: d.upCount, createdAt: new Date(d.createdAt).toISOString() })),
    };
  } catch {
    // La détection de doublons ne doit jamais bloquer un dépôt.
    return { ok: true, duplicates: [] };
  }
}

export type SubmitResult =
  | { ok: true; issueId: string; trackingToken: string; status: "PUBLISHED" | "MANUAL_REVIEW" | "REJECTED"; showHelp: boolean; publicReason?: string; schoolSlug: string }
  | Fail;

/** Dépôt d'un signalement : identité anonyme, limites, modération, création. */
export async function submitIssueAction(input: unknown): Promise<SubmitResult> {
  const parsed = draftWithToken.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? GENERIC };
  const { turnstileToken, ...draft } = parsed.data;

  // Turnstile à chaque dépôt (pas seulement à la création d'identité).
  if (!(await verifyTurnstile(turnstileToken, await clientIp()))) {
    return { ok: false, error: PARTICIPANT_ERRORS.captcha };
  }
  const participant = await requireParticipant(turnstileToken, { captchaVerified: true });
  if (!participant.ok) return { ok: false, error: PARTICIPANT_ERRORS[participant.error] };
  const limits = await Promise.all([
    rateLimit("submit", participant.identityId),
    rateLimit("submitIp", participant.ipKey),
    rateLimit("submitDaily", participant.identityId),
    rateLimit("submitDailyIp", participant.ipKey),
  ]);
  if (limits.some((l) => !l.ok)) return { ok: false, error: "Tu as déjà envoyé plusieurs signalements récemment. Réessaie plus tard." };

  const school = await prisma.school.findUnique({ where: { id: draft.schoolId }, select: { slug: true } });
  if (!school) return { ok: false, error: "Lycée introuvable." };

  try {
    const created = await createIssue(draft, participant.identityId);
    if (created.status === "PUBLISHED") {
      revalidatePath(`/lycee/${school.slug}`);
      revalidatePath("/");
    }
    return { ok: true, ...created, schoolSlug: school.slug };
  } catch (e) {
    console.error("submitIssue", e);
    return { ok: false, error: GENERIC };
  }
}

const reportWithToken = contentReportSchema.extend({ turnstileToken: z.string().max(4096).nullish() });
const REPORTS_TO_HIDE = 3;

/** « Signaler un contenu » (DSA) : passe le problème en tête de la file de modération. */
export async function reportContentAction(input: unknown): Promise<{ ok: true } | Fail> {
  const parsed = reportWithToken.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC };
  const ip = await clientIp();
  if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) return { ok: false, error: PARTICIPANT_ERRORS.captcha };
  const ipKey = await ipFingerprint();
  const limit = await rateLimit("report", ipKey);
  if (!limit.ok) return { ok: false, error: RATE_LIMITED };

  const issue = await prisma.issue.findFirst({
    where: { id: parsed.data.issueId, moderationStatus: { in: ["PUBLISHED", "AUTO_APPROVED"] } },
    select: { id: true, moderationStatus: true },
  });
  if (!issue) return { ok: true };

  const reporterKey = sha256(`${ipKey}:${parsed.data.issueId}`);
  try {
    await prisma.contentReport.create({
      data: { issueId: issue.id, reason: parsed.data.reason, comment: parsed.data.comment || null, reporterKey },
    });
  } catch {
    return { ok: true }; // déjà signalé par cette personne aujourd'hui
  }
  const open = await prisma.contentReport.count({ where: { issueId: issue.id, status: "OPEN" } });
  const urgent = parsed.data.reason === "PERSON_TARGETED" || parsed.data.reason === "PERSONAL_DATA";
  await prisma.issue.update({
    where: { id: issue.id },
    data:
      open >= REPORTS_TO_HIDE
        ? // Dépublication provisoire en attendant la décision humaine.
          { moderationStatus: "MANUAL_REVIEW", reviewPriority: "ELEVATED", flaggedForReview: true }
        : { flaggedForReview: true, ...(urgent ? { reviewPriority: "ELEVATED" as const } : {}) },
  });
  return { ok: true };
}

const trackInput = z.object({ token: z.string().min(10).max(100) });

/** Suppression de son propre signalement depuis le lien de suivi. */
export async function deleteOwnIssueAction(input: unknown): Promise<{ ok: true } | Fail> {
  const parsed = trackInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC };
  const limit = await rateLimit("privacy", await ipFingerprint());
  if (!limit.ok) return { ok: false, error: RATE_LIMITED };
  const issue = await prisma.issue.findUnique({ where: { trackingTokenHash: sha256(parsed.data.token) }, select: { id: true, school: { select: { slug: true } } } });
  if (!issue) return { ok: false, error: "Signalement introuvable." };
  await prisma.issue.delete({ where: { id: issue.id } });
  revalidatePath(`/lycee/${issue.school.slug}`);
  return { ok: true };
}

const idsInput = z.array(z.string().min(1).max(40)).max(500);

/** Votes de l'élève (identité anonyme du cookie) : permet de garder les pages publiques en cache. */
export async function myVotesAction(ids: unknown): Promise<Record<string, "UP" | "DOWN">> {
  const parsed = idsInput.safeParse(ids);
  if (!parsed.success) return {};
  const { currentIdentityId } = await import("@/server/identity");
  const identityId = await currentIdentityId();
  if (!identityId || !parsed.data.length) return {};
  const votes = await prisma.issueVote.findMany({ where: { identityId, issueId: { in: parsed.data } }, select: { issueId: true, value: true } });
  return Object.fromEntries(votes.map((v) => [v.issueId, v.value]));
}
