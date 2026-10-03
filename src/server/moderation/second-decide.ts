// Couche 3 : second avis (GPT) sur un signalement que Jev envoie en revue humaine. Fonctions pures, testées.
// Le second avis peut publier, publier après une reformulation légère, ou laisser la revue humaine.
// Il ne refuse jamais rien et ne touche jamais aux cas urgents (détresse, menace, mineurs).
import { DESCRIPTION_MAX, DESCRIPTION_MIN, TITLE_MAX, TITLE_MIN } from "@/lib/schemas";
import type { DecisionResult } from "./decide";
import type { JevResult } from "./jev";
import type { RuleHit } from "./rules";

export interface IssueSecondOpinion {
  verdict: "publish" | "rephrase" | "review";
  /** Texte reformulé, seulement pour « rephrase ». */
  title?: string;
  description?: string;
  reason: string;
}

/**
 * Reproche visant le comportement d'une personne : retirer le nom ne suffit pas (elle reste reconnaissable
 * dans sa classe), la modération humaine tranche toujours.
 */
export const PERSONAL_GRIEVANCE = { harassment: 0.5, insult: 0.5, defamation: 0.7 } as const;

export function isEligibleForSecondOpinion(outcome: DecisionResult, jev: JevResult | null, rules: RuleHit[]): boolean {
  const grievance = jev ? (Object.keys(PERSONAL_GRIEVANCE) as (keyof typeof PERSONAL_GRIEVANCE)[]).some((k) => (jev.risks[k] ?? 0) >= PERSONAL_GRIEVANCE[k]) : false;
  return (
    outcome.decision === "MANUAL_REVIEW" &&
    !grievance &&
    outcome.priority !== "URGENT" &&
    !outcome.showHelp &&
    jev !== null &&
    !rules.some((r) => r.level === "urgent" || r.code === "INJECTION") &&
    !outcome.reason.includes("interrupteur d'urgence")
  );
}

const words = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);

/** Part des mots (4 lettres et plus) du texte reformulé déjà présents chez l'élève : une reformulation légère en garde l'essentiel. */
export function keptWordsRatio(original: string, rewritten: string): number {
  const orig = new Set(words(original));
  const next = words(rewritten);
  if (!next.length) return 0;
  return next.filter((w) => orig.has(w)).length / next.length;
}

export type SecondDecision =
  | { action: "publish"; title: string; description: string; rephrased: boolean; reason: string }
  | { action: "review"; reason: string };

/**
 * `rulesOn` relance les règles déterministes sur le texte reformulé : une reformulation qui garde
 * un nom, un contact ou une insulte repart en revue humaine.
 */
export function applySecondOpinion(
  original: { title: string; description: string },
  gpt: IssueSecondOpinion | null,
  rulesOn: (title: string, description: string) => RuleHit[],
): SecondDecision {
  if (!gpt) return { action: "review", reason: "Second avis indisponible" };
  const why = gpt.reason.slice(0, 200);
  if (gpt.verdict === "publish") return { action: "publish", ...original, rephrased: false, reason: `Publié après second avis : ${why}` };
  if (gpt.verdict !== "rephrase" || !gpt.title || !gpt.description) return { action: "review", reason: `Doute confirmé par le second avis : ${why}` };

  const title = gpt.title.trim();
  const description = gpt.description.trim();
  if (title.length < TITLE_MIN || title.length > TITLE_MAX || description.length < DESCRIPTION_MIN || description.length > DESCRIPTION_MAX)
    return { action: "review", reason: "Reformulation hors des longueurs autorisées" };
  if (rulesOn(title, description).some((r) => r.level !== "soft"))
    return { action: "review", reason: "La reformulation déclenche encore les règles" };
  if (keptWordsRatio(`${original.title} ${original.description}`, `${title} ${description}`) < 0.6)
    return { action: "review", reason: "Reformulation trop éloignée du texte de l'élève" };
  const same = title === original.title && description === original.description;
  return { action: "publish", title, description, rephrased: !same, reason: `${same ? "Publié" : "Reformulé et publié"} après second avis : ${why}` };
}
