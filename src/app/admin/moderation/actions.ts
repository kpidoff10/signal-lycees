"use server";

import { requireAdmin } from "@/server/admin/auth";
import { parseForm, type ActionState } from "@/server/admin/forms";
import { keepPublished, publishIssue, rejectIssue } from "@/server/admin/moderation";
import { runAction } from "@/server/admin/run";
import { editPublishSchema, issueRefSchema, rejectSchema } from "@/server/admin/schemas";

export async function publishAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(issueRefSchema, fd);
  if (!p.ok) return { error: p.error };
  return runAction(() => publishIssue(admin.id, p.data.issueId, { internalReason: p.data.internalReason }), "Publié.");
}

export async function editPublishAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(editPublishSchema, fd);
  if (!p.ok) return { error: p.error };
  const { issueId, internalReason, title, description, category } = p.data;
  return runAction(
    () => publishIssue(admin.id, issueId, { internalReason, edit: { title, description, category } }),
    "Modifié et publié.",
  );
}

export async function rejectAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(rejectSchema, fd);
  if (!p.ok) return { error: p.error };
  const { issueId, publicReason, internalReason } = p.data;
  return runAction(() => rejectIssue(admin.id, issueId, { publicReason, internalReason }), "Refusé : le motif est communiqué à l'auteur.");
}

export async function keepPublishedAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(issueRefSchema, fd);
  if (!p.ok) return { error: p.error };
  return runAction(() => keepPublished(admin.id, p.data.issueId, { internalReason: p.data.internalReason }), "Laissé publié ; signalements classés.");
}
