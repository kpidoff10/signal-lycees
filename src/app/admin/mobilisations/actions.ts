"use server";

import { z } from "zod";
import { cleanUserText } from "@/lib/text";
import { requireAdmin } from "@/server/admin/auth";
import { idSchema, parseForm, type ActionState } from "@/server/admin/forms";
import { addMobilization, approveMobilization, approveMobilizationsFromBatch, approveMobilizationsFromSource, endMobilization, rejectMobilization } from "@/server/admin/mobilizations";
import { runAction } from "@/server/admin/run";

const reasons = z
  .string()
  .optional()
  .transform((v) => (v ? cleanUserText(v) : ""))
  .pipe(z.string().max(200, "Motifs : 200 caractères maximum."));

const approveSchema = z.object({ id: idSchema, reasons });
const idOnly = z.object({ id: idSchema });
const addSchema = z.object({
  schoolSlug: z.string().trim().min(3).max(120).regex(/^[a-z0-9-]+$/, "Identifiant de lycée invalide."),
  happenedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  reasons,
  sourceName: z.string().trim().max(80).optional(),
  sourceUrl: z.union([z.literal(""), z.string().trim().url("Lien invalide.").max(500)]).optional(),
});

export async function approveAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(approveSchema, fd);
  if (!p.ok) return { error: p.error };
  return runAction(() => approveMobilization(admin.id, p.data.id, p.data.reasons || null), "Mobilisation publiée.");
}

const sourceOnly = z.object({ sourceUrl: z.string().trim().url().max(500) });

export async function approveListAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(sourceOnly, fd);
  if (!p.ok) return { error: p.error };
  return runAction(() => approveMobilizationsFromSource(admin.id, p.data.sourceUrl), "Liste publiée.");
}

const batchOnly = z.object({ importBatch: z.string().regex(/^recherche-\d{4}-\d{2}-\d{2}$/) });

export async function approveBatchAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(batchOnly, fd);
  if (!p.ok) return { error: p.error };
  return runAction(() => approveMobilizationsFromBatch(admin.id, p.data.importBatch), "Recherche publiée.");
}

export async function rejectAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(idOnly, fd);
  if (!p.ok) return { error: p.error };
  return runAction(() => rejectMobilization(admin.id, p.data.id), "Mobilisation refusée.");
}

export async function endAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(idOnly, fd);
  if (!p.ok) return { error: p.error };
  return runAction(() => endMobilization(admin.id, p.data.id), "Mobilisation retirée de la carte.");
}

export async function addAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(addSchema, fd);
  if (!p.ok) return { error: p.error };
  return runAction(
    () => addMobilization(admin.id, { ...p.data, reasons: p.data.reasons || undefined, sourceUrl: p.data.sourceUrl || undefined }),
    "Mobilisation ajoutée.",
  );
}
