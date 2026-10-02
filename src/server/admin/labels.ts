// Libellés français de l'admin et motifs de refus types. Module pur.
import type { RiskKey } from "../moderation/jev";

export const ISSUE_STATUSES = ["ACTIVE", "POSSIBLY_RESOLVED", "RESOLVED"] as const;
export const MODERATION_STATUSES = ["PENDING", "AUTO_APPROVED", "MANUAL_REVIEW", "REJECTED", "PUBLISHED"] as const;

export const ISSUE_STATUS_LABEL: Record<(typeof ISSUE_STATUSES)[number], string> = {
  ACTIVE: "Actif",
  POSSIBLY_RESOLVED: "Peut-être résolu",
  RESOLVED: "Résolu",
};

export const MODERATION_STATUS_LABEL: Record<(typeof MODERATION_STATUSES)[number], string> = {
  PENDING: "En attente",
  AUTO_APPROVED: "Approuvé automatiquement",
  MANUAL_REVIEW: "Revue manuelle",
  REJECTED: "Refusé",
  PUBLISHED: "Publié",
};

export const PRIORITY_LABEL = { NORMAL: "Normale", ELEVATED: "Élevée", URGENT: "URGENT" } as const;

export const REPORT_REASON_LABEL = {
  PERSON_TARGETED: "Vise une personne",
  PERSONAL_DATA: "Données personnelles",
  INSULT_HARASSMENT: "Insulte ou harcèlement",
  FALSE_OR_DEFAMATORY: "Faux ou diffamatoire",
  OTHER: "Autre",
} as const;

export const RISK_LABEL: Record<RiskKey, string> = {
  personalData: "Données personnelles",
  namedPerson: "Personne identifiable",
  insult: "Insulte",
  harassment: "Harcèlement",
  defamation: "Diffamation",
  threat: "Menace",
  selfHarm: "Détresse",
  sexualMinor: "Sexuel / mineur",
  offTopic: "Hors sujet",
};

/** Motifs publics de refus (communiqués à l'auteur, exigence DSA). */
export const REFUSAL_REASONS = {
  PERSON: "Ton signalement vise une personne identifiable. Décris uniquement la situation, sans viser personne.",
  PERSONAL_DATA: "Ton signalement contient des données personnelles (nom, contact, pseudo…), qui ne peuvent pas être publiées.",
  INSULT: "Ton signalement contient des propos insultants ou méprisants.",
  ACCUSATION: "Ton signalement présente comme des faits des accusations graves contre quelqu'un : elles ne peuvent pas être publiées ici.",
  OFF_TOPIC: "Ton texte ne semble pas décrire un problème concret dans un lycée.",
  DUPLICATE: "Ce problème est déjà signalé pour ce lycée : tu peux confirmer le signalement existant.",
  SERIOUS:
    "Ton message évoque une situation grave qui ne peut pas être publiée. Si toi ou quelqu'un est en danger, parle à un adulte de confiance ou appelle le 119 (enfance en danger) ou le 3114 (gratuits, 24 h/24).",
  OTHER: "",
} as const;

export type RefusalCode = keyof typeof REFUSAL_REASONS;
export const REFUSAL_CODES = Object.keys(REFUSAL_REASONS) as [RefusalCode, ...RefusalCode[]];

export const REFUSAL_SHORT: Record<RefusalCode, string> = {
  PERSON: "Vise une personne",
  PERSONAL_DATA: "Données personnelles",
  INSULT: "Insultes",
  ACCUSATION: "Accusations graves",
  OFF_TOPIC: "Hors sujet",
  DUPLICATE: "Doublon",
  SERIOUS: "Situation grave (ressources d'aide)",
  OTHER: "Autre (texte libre obligatoire)",
};
