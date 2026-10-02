// Ordre de la file de modération. Fonction pure, testée ; la requête SQL de
// src/server/admin/moderation.ts applique exactement le même rang.
export type QueuePriority = "NORMAL" | "ELEVATED" | "URGENT";

export interface QueueSortable {
  reviewPriority: QueuePriority;
  flaggedForReview: boolean;
  openReports: number;
  createdAt: Date;
  id: string;
}

/** 0 = urgent, 1 = élevé, 2 = signalé (👎 ou signalement de contenu), 3 = le reste. */
export function queueRank(i: Pick<QueueSortable, "reviewPriority" | "flaggedForReview" | "openReports">): number {
  if (i.reviewPriority === "URGENT") return 0;
  if (i.reviewPriority === "ELEVATED") return 1;
  if (i.flaggedForReview || i.openReports > 0) return 2;
  return 3;
}

/** Rang croissant, puis le plus ancien d'abord, puis id (ordre stable). */
export function compareQueue(a: QueueSortable, b: QueueSortable): number {
  return (
    queueRank(a) - queueRank(b) ||
    a.createdAt.getTime() - b.createdAt.getTime() ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

export function sortQueue<T extends QueueSortable>(items: T[]): T[] {
  return [...items].sort(compareQueue);
}
