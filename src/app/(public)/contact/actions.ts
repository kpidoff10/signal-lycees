"use server";

import { privacyRequestSchema } from "@/lib/schemas";
import { createPrivacyRequest } from "@/server/privacy";
import { rateLimit } from "@/server/rate-limit";
import { ipFingerprint } from "@/server/request";

export type ContactField = "kind" | "issueId" | "message" | "contact";

export interface ContactState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<ContactField, string>>;
  /** Le signalement mentionné a été retrouvé (seulement en cas de succès). */
  issueFound?: boolean;
  kind?: "DELETION" | "CONTACT";
}

const optionalText = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v : undefined);

export async function submitContactRequest(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = privacyRequestSchema.safeParse({
    kind: formData.get("kind"),
    issueId: optionalText(formData.get("issueId")),
    message: typeof formData.get("message") === "string" ? formData.get("message") : "",
    contact: optionalText(formData.get("contact")),
  });

  if (!parsed.success) {
    const fieldErrors: ContactState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as ContactField | undefined;
      if (!field || fieldErrors[field]) continue;
      fieldErrors[field] =
        field === "kind"
          ? "Choisis le type de demande."
          : field === "issueId"
            ? "Le lien ou l’identifiant est trop long (100 caractères maximum)."
            : field === "contact"
              ? "Le moyen de contact est trop long (200 caractères maximum)."
              : issue.code === "too_big"
                ? "Ton message est trop long (2 000 caractères maximum)."
                : "Ton message est trop court (10 caractères minimum).";
    }
    return { status: "error", message: "Certains champs sont à corriger.", fieldErrors };
  }

  const limit = await rateLimit("privacy", await ipFingerprint());
  if (!limit.ok) {
    return {
      status: "error",
      message: "Tu as envoyé plusieurs demandes en peu de temps. Réessaie dans une heure : ta demande n’est pas perdue si tu gardes ton texte.",
    };
  }

  try {
    const created = await createPrivacyRequest(parsed.data);
    return { status: "success", issueFound: Boolean(created.issueId), kind: parsed.data.kind };
  } catch (err) {
    // On ne journalise pas le contenu de la demande, seulement la nature de l'erreur.
    console.error("[contact] échec de l'enregistrement :", err instanceof Error ? err.name : "erreur inconnue");
    return { status: "error", message: "Ta demande n’a pas pu être enregistrée à cause d’un problème technique. Réessaie dans quelques minutes." };
  }
}
