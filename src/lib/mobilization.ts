// Règles d'affichage des mobilisations (fonctions pures, testées).

/** Début du jour (heure de Paris approximée en UTC+0 : suffisant à l'échelle de quelques jours). */
export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/** Fin d'affichage : la date de la mobilisation + la durée de validité. */
export function expiryFor(happenedOn: Date, ttlHours: number): Date {
  return new Date(startOfDay(happenedOn).getTime() + ttlHours * 3600_000);
}

/** Une date déclarée par un élève : aujourd'hui, hier ou avant-hier seulement. */
export function happenedOnFromChoice(choice: "today" | "yesterday" | "2days", now = new Date()): Date {
  const offset = choice === "today" ? 0 : choice === "yesterday" ? 1 : 2;
  return startOfDay(new Date(now.getTime() - offset * 86_400_000));
}

export function isActive(m: { status: string; expiresAt: Date }, now = new Date()): boolean {
  return m.status === "PUBLISHED" && m.expiresAt.getTime() > now.getTime();
}
