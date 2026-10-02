// Évolution automatique du statut d'un problème. Fonction pure, testée.
// Un vote isolé ne résout jamais un problème ; RESOLVED automatique seulement
// après une longue période sans nouvelle confirmation.

export type IssueStatus = "ACTIVE" | "POSSIBLY_RESOLVED" | "RESOLVED";

export const STATUS_RULES = {
  windowDays: 14,
  minResolvedVotes: 3,
  /** Votes « résolu » récents / confirmations récentes. */
  resolvedRatio: 0.5,
  /** Confirmations depuis le passage en POSSIBLY_RESOLVED pour revenir en ACTIVE. */
  reactivateUpVotes: 2,
  /** Jours en POSSIBLY_RESOLVED sans confirmation avant RESOLVED automatique. */
  autoResolveDays: 21,
};

export interface StatusInput {
  status: IssueStatus;
  statusChangedAt: Date;
  recentUp: number;
  recentResolved: number;
  upSinceStatusChange: number;
  now: Date;
}

export function nextStatus(i: StatusInput): IssueStatus {
  if (i.status === "RESOLVED") return "RESOLVED";
  if (i.status === "ACTIVE") {
    if (i.recentResolved >= STATUS_RULES.minResolvedVotes && i.recentResolved >= STATUS_RULES.resolvedRatio * i.recentUp) {
      return "POSSIBLY_RESOLVED";
    }
    return "ACTIVE";
  }
  // POSSIBLY_RESOLVED
  if (i.upSinceStatusChange >= STATUS_RULES.reactivateUpVotes) return "ACTIVE";
  const days = (i.now.getTime() - i.statusChangedAt.getTime()) / 86_400_000;
  if (days >= STATUS_RULES.autoResolveDays && i.upSinceStatusChange === 0) return "RESOLVED";
  return "POSSIBLY_RESOLVED";
}

export const DOWNVOTE_REVIEW = { minDown: 5, ratio: 0.5 };

/** 👎 « pas sérieux » : au-delà du seuil, revue humaine (jamais de masquage automatique). */
export function needsDownvoteReview(up: number, down: number): boolean {
  return down >= DOWNVOTE_REVIEW.minDown && down >= DOWNVOTE_REVIEW.ratio * Math.max(up, 1);
}

export const CONFIRMATION_MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

export function crossedMilestone(before: number, after: number): number | null {
  return CONFIRMATION_MILESTONES.find((m) => before < m && after >= m) ?? null;
}
