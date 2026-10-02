import "server-only";
import { notify } from "./notify";
import { prisma } from "@/lib/db";
import { sha256 } from "./crypto";

export type PrivacyKind = "DELETION" | "CONTACT";

export interface PrivacyRequestInput {
  kind: PrivacyKind;
  issueId?: string;
  message: string;
  contact?: string;
}

// Identifiant cuid (ex. « cm1abc… ») : lettres minuscules et chiffres.
const ID_RE = /^[a-z0-9]{20,40}$/;

/**
 * Retrouve l'identifiant d'un problème à partir de ce que l'élève a collé :
 * un lien de suivi (/suivi/<jeton>), un lien public (/probleme/<id>[-slug])
 * ou l'identifiant seul. Renvoie `null` si rien ne correspond.
 */
export async function resolveIssueReference(raw: string | undefined): Promise<string | null> {
  const ref = raw?.trim();
  if (!ref) return null;

  const tracking = ref.match(/\/suivi\/([A-Za-z0-9_-]{16,100})/);
  if (tracking) {
    const issue = await prisma.issue.findUnique({
      where: { trackingTokenHash: sha256(tracking[1]!) },
      select: { id: true },
    });
    return issue?.id ?? null;
  }

  const publicLink = ref.match(/\/probleme\/([A-Za-z0-9_-]+)/);
  const candidate = publicLink ? publicLink[1]! : ref;
  const ids = new Set([candidate, candidate.split("-")[0]!].filter((c) => ID_RE.test(c)));
  for (const id of ids) {
    const issue = await prisma.issue.findUnique({ where: { id }, select: { id: true } });
    if (issue) return issue.id;
  }
  return null;
}

/** Enregistre une demande (suppression, contact, point de contact DSA) pour traitement humain. */
export async function createPrivacyRequest(input: PrivacyRequestInput) {
  const issueId = await resolveIssueReference(input.issueId);
  // Référence non reconnue : on la garde dans le message pour que l'éditeur puisse chercher,
  // sauf s'il s'agit d'un lien de suivi (jeton secret, jamais stocké en clair).
  const unresolved = input.issueId?.trim() && !issueId && !input.issueId.includes("/suivi/") ? input.issueId.trim() : null;
  const message = unresolved ? `${input.message}\n\n[Référence fournie, non reconnue : ${unresolved}]` : input.message;

  const created = await prisma.privacyRequest.create({
    data: {
      kind: input.kind,
      issueId,
      message,
      contact: input.contact?.trim() ? input.contact.trim() : null,
    },
    select: { id: true, issueId: true },
  });
  notify({ type: "privacy", kind: input.kind, linked: issueId !== null });
  return created;
}
