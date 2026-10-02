"use server";

import { requireAdmin } from "@/server/admin/auth";
import { parseForm, type ActionState } from "@/server/admin/forms";
import { deleteRequestedIssue, markHandled } from "@/server/admin/requests";
import { runAction } from "@/server/admin/run";
import { deleteRequestSchema, handledSchema } from "@/server/admin/schemas";

export async function handledAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(handledSchema, fd);
  if (!p.ok) return { error: p.error };
  return runAction(() => markHandled(admin.id, p.data.requestId, p.data.handled), p.data.handled ? "Marquée traitée." : "Rouverte.");
}

export async function deleteRequestedIssueAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin("ADMIN");
  const p = parseForm(deleteRequestSchema, fd);
  if (!p.ok) return { error: p.error };
  return runAction(() => deleteRequestedIssue(admin.id, p.data.requestId), "Signalement supprimé, demande traitée.");
}
