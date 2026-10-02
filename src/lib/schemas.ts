import { z } from "zod";
import { CATEGORY_IDS } from "./categories";
import { cleanUserText } from "./text";

export const TITLE_MIN = 8;
export const TITLE_MAX = 80;
export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 1000;

const userText = (min: number, max: number, label: string) =>
  z
    .string()
    .transform(cleanUserText)
    .pipe(
      z
        .string()
        .min(min, `${label} : ${min} caractères minimum.`)
        .max(max, `${label} : ${max} caractères maximum.`),
    );

// Schéma partagé entre le formulaire (client) et les actions serveur.
export const issueDraftSchema = z.object({
  schoolId: z.string().min(1, "Choisis ton lycée."),
  category: z.enum(CATEGORY_IDS, { message: "Choisis une catégorie." }),
  title: userText(TITLE_MIN, TITLE_MAX, "Titre"),
  description: userText(DESCRIPTION_MIN, DESCRIPTION_MAX, "Description"),
});

export type IssueDraft = z.infer<typeof issueDraftSchema>;

export const contentReportSchema = z.object({
  issueId: z.string().min(1),
  reason: z.enum(["PERSON_TARGETED", "PERSONAL_DATA", "INSULT_HARASSMENT", "FALSE_OR_DEFAMATORY", "OTHER"]),
  comment: z.string().transform(cleanUserText).pipe(z.string().max(500)).optional(),
});

export const privacyRequestSchema = z.object({
  kind: z.enum(["DELETION", "CONTACT"]),
  issueId: z.string().max(100).optional(),
  message: z.string().transform(cleanUserText).pipe(z.string().min(10, "10 caractères minimum.").max(2000)),
  contact: z.string().transform(cleanUserText).pipe(z.string().max(200)).optional(),
});
