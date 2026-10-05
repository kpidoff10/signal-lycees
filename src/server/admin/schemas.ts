// Schémas Zod des actions admin (validation côté serveur uniquement).
import { z } from "zod";
import { issueDraftSchema } from "@/lib/schemas";
import { idSchema, internalReasonSchema } from "./forms";
import { ISSUE_STATUSES, REFUSAL_CODES, REFUSAL_REASONS } from "./labels";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Identifiant requis.").max(64),
  password: z.string().min(1, "Mot de passe requis.").max(256),
  code: z
    .string()
    .trim()
    .max(12)
    .optional()
    .transform((v) => v || undefined),
});

export const issueRefSchema = z.object({ issueId: idSchema, internalReason: internalReasonSchema });

const editFields = issueDraftSchema.pick({ category: true, title: true, description: true });
export const editPublishSchema = issueRefSchema.extend(editFields.shape);

export const rejectSchema = issueRefSchema
  .extend({
    reasonCode: z.enum(REFUSAL_CODES, { message: "Choisis un motif de refus." }),
    reasonText: z.string().trim().max(500, "Précision : 500 caractères maximum.").optional().default(""),
  })
  .superRefine((v, ctx) => {
    if (v.reasonCode === "OTHER" && v.reasonText.length < 10) {
      ctx.addIssue({ code: "custom", path: ["reasonText"], message: "Motif « Autre » : écris un motif public (10 caractères minimum)." });
    }
  })
  .transform((v) => ({
    issueId: v.issueId,
    internalReason: v.internalReason,
    publicReason: v.reasonCode === "OTHER" ? v.reasonText : [REFUSAL_REASONS[v.reasonCode], v.reasonText].filter(Boolean).join("\n\n"),
  }));

export const statusSchema = z.object({ issueId: idSchema, status: z.enum(ISSUE_STATUSES, { message: "Statut invalide." }) });

export const confirmDeleteSchema = z.object({
  confirm: z.literal("SUPPRIMER", { message: "Tape SUPPRIMER pour confirmer." }),
});

export const deleteIssueSchema = confirmDeleteSchema.extend({ issueId: idSchema });

const optionalNumber = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} requise.`)
    .transform((v) => Number(v.replace(",", ".")))
    .pipe(z.number({ message: `${label} invalide.` }).finite(`${label} invalide.`).min(min, `${label} invalide.`).max(max, `${label} invalide.`));

export const schoolEditSchema = z.object({
  schoolId: idSchema,
  name: z.string().trim().min(2, "Nom : 2 caractères minimum.").max(200),
  address: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => v || undefined),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Code postal : 5 chiffres."),
  city: z.string().trim().min(1, "Ville requise.").max(120),
  latitude: optionalNumber(-90, 90, "Latitude"),
  longitude: optionalNumber(-180, 180, "Longitude"),
  isOpen: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

const flag = z.enum(["0", "1"]).transform((v) => v === "1");

export const banSchema = z.object({ identityId: idSchema, banned: flag });
export const handledSchema = z.object({ requestId: idSchema, handled: flag });
export const deleteRequestSchema = confirmDeleteSchema.extend({ requestId: idSchema });
export const freezeSchema = z.object({ frozen: flag });
export const secondOpinionSchema = z.object({ scope: z.enum(["issues", "press", "mobilizations", "verification"]), enabled: flag });
