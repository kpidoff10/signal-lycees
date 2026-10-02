"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/admin/auth";
import { parseForm, type ActionState } from "@/server/admin/forms";
import { deleteIssue, setIssueStatus } from "@/server/admin/issues";
import { ISSUE_STATUS_LABEL } from "@/server/admin/labels";
import { runAction } from "@/server/admin/run";
import { deleteIssueSchema, statusSchema } from "@/server/admin/schemas";

export async function statusAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(statusSchema, fd);
  if (!p.ok) return { error: p.error };
  return runAction(() => setIssueStatus(admin.id, p.data.issueId, p.data.status), `Statut : ${ISSUE_STATUS_LABEL[p.data.status]}.`);
}

export async function deleteIssueAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin("ADMIN");
  const p = parseForm(deleteIssueSchema, fd);
  if (!p.ok) return { error: p.error };
  const r = await runAction(() => deleteIssue(admin.id, p.data.issueId, { reason: "Suppression manuelle" }), "Supprimé.");
  if (r.ok) redirect("/admin/issues");
  return r;
}
