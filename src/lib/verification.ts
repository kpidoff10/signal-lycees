// Vérification d'une mobilisation trouvée par recherche ou liste : règle de décision (pure, testée).

export interface ArticleCheck {
  /** L'article dit que CE lycée (cette commune) était bloqué, fermé ou à distance CE jour-là. */
  confirmed: boolean;
  verdict: "publish" | "reject" | "unsure";
  reason: string;
}

export type VerificationOutcome = { status: "PUBLISHED" | "REJECTED" | "PENDING"; note: string };

/** Publiée si l'IA confirme, refusée si elle infirme, à valider sinon (ou si elle est indisponible). */
export function decideVerification(check: ArticleCheck | null): VerificationOutcome {
  if (!check) return { status: "PENDING", note: "Vérification IA indisponible" };
  const why = check.reason.trim().slice(0, 240);
  if (check.verdict === "publish" && check.confirmed) return { status: "PUBLISHED", note: `Confirmée par l'IA : ${why}` };
  if (check.verdict === "reject") return { status: "REJECTED", note: `Écartée par l'IA : ${why}` };
  return { status: "PENDING", note: `À vérifier : ${why}` };
}
