// Moteur de décision : combine règles et analyse Jev. Fonction pure, testée.
// Principe : tout ce qui est ambigu ou sensible part en MANUAL_REVIEW.
import type { JevResult, RiskKey } from "./jev";
import type { RuleHit } from "./rules";

export const THRESHOLDS = {
  /** En dessous : risque considéré absent. */
  low: 0.15,
  /** Au-dessus : risque considéré certain. */
  high: 0.85,
  /** Exigence renforcée quand le texte mentionne un rôle (« le CPE », « la prof de »). */
  roleNamedPerson: 0.08,
};

export type Decision = "AUTO_APPROVED" | "MANUAL_REVIEW" | "REJECTED";
export type Priority = "NORMAL" | "ELEVATED" | "URGENT";

export interface DecisionResult {
  decision: Decision;
  priority: Priority;
  /** Afficher immédiatement les ressources d'aide à l'auteur. */
  showHelp: boolean;
  reason: string;
  /** Motif public en cas de refus (DSA). */
  publicReason?: string;
  flags: string[];
}

const URGENT_RISKS: RiskKey[] = ["threat", "selfHarm", "sexualMinor"];
const PERSON_RISKS: RiskKey[] = ["personalData", "namedPerson", "insult", "harassment", "defamation"];

export function decide(input: {
  rules: RuleHit[];
  jev: JevResult | null;
  jevError?: string;
  frozen?: boolean;
}): DecisionResult {
  const { rules, jev } = input;
  const flags = rules.map((r) => `rule:${r.code}`);
  const ruleCodes = new Set(rules.map((r) => r.code));

  if (jev) {
    for (const k of Object.keys(jev.risks) as RiskKey[]) {
      if (jev.risks[k] >= THRESHOLDS.low) flags.push(`jev:${k}=${jev.risks[k].toFixed(2)}`);
    }
  }

  const selfHarm = ruleCodes.has("SELF_HARM") || (jev ? jev.risks.selfHarm >= THRESHOLDS.low : false);
  const urgent =
    rules.some((r) => r.level === "urgent") || (jev ? URGENT_RISKS.some((k) => jev.risks[k] >= THRESHOLDS.low) : false);

  if (urgent) {
    return {
      decision: "MANUAL_REVIEW",
      priority: "URGENT",
      showHelp: selfHarm,
      reason: selfHarm ? "Signes possibles de détresse : revue humaine prioritaire." : "Contenu potentiellement grave : revue humaine prioritaire.",
      flags,
    };
  }

  if (!jev) {
    return {
      decision: "MANUAL_REVIEW",
      priority: rules.some((r) => r.level === "hard") ? "ELEVATED" : "NORMAL",
      showHelp: false,
      reason: `Analyse automatique indisponible (${input.jevError ?? "inconnue"}) : revue manuelle.`,
      flags,
    };
  }

  // Refus automatiques : uniquement quand règles et IA concordent, ou spam certain.
  if (ruleCodes.has("INSULT") && jev.risks.insult >= THRESHOLDS.high) {
    return {
      decision: "REJECTED",
      priority: "NORMAL",
      showHelp: false,
      reason: "Insulte détectée par les règles et par l'analyse.",
      publicReason: "Ton signalement contient des propos insultants. Décris uniquement la situation, sans viser personne.",
      flags,
    };
  }
  if (jev.risks.offTopic >= 0.95 && !rules.length) {
    return {
      decision: "REJECTED",
      priority: "NORMAL",
      showHelp: false,
      reason: "Hors sujet (spam, test ou texte sans rapport).",
      publicReason: "Ton texte ne semble pas décrire un problème dans un lycée.",
      flags,
    };
  }

  if (input.frozen) {
    return { decision: "MANUAL_REVIEW", priority: "NORMAL", showHelp: false, reason: "Publication automatique suspendue (interrupteur d'urgence).", flags };
  }

  const hard = rules.filter((r) => r.level === "hard");
  if (hard.length) {
    return {
      decision: "MANUAL_REVIEW",
      priority: "ELEVATED",
      showHelp: false,
      reason: `Règles déclenchées : ${hard.map((r) => r.code).join(", ")}.`,
      flags,
    };
  }

  const personRisk = PERSON_RISKS.find((k) => jev.risks[k] >= THRESHOLDS.low);
  if (personRisk) {
    return {
      decision: "MANUAL_REVIEW",
      priority: "ELEVATED",
      showHelp: false,
      reason: `Risque « ${personRisk} » au-dessus du seuil.`,
      flags,
    };
  }
  if (jev.risks.offTopic >= THRESHOLDS.low) {
    return { decision: "MANUAL_REVIEW", priority: "NORMAL", showHelp: false, reason: "Pertinence incertaine.", flags };
  }
  if (ruleCodes.has("ROLE_TARGETED") && jev.risks.namedPerson >= THRESHOLDS.roleNamedPerson) {
    return {
      decision: "MANUAL_REVIEW",
      priority: "ELEVATED",
      showHelp: false,
      reason: "Rôle mentionné avec un risque d'identification.",
      flags,
    };
  }

  return { decision: "AUTO_APPROVED", priority: "NORMAL", showHelp: false, reason: "Aucun risque détecté.", flags };
}
