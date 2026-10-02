"use server";

import { redirect } from "next/navigation";
import { LOGIN_PATH, logout, requireAdmin } from "@/server/admin/auth";
import { setFreeze } from "@/server/admin/dashboard";
import { parseForm, type ActionState } from "@/server/admin/forms";
import { runAction } from "@/server/admin/run";
import { freezeSchema } from "@/server/admin/schemas";

export async function logoutAction() {
  await logout();
  redirect(LOGIN_PATH);
}

export async function freezeAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(freezeSchema, fd);
  if (!p.ok) return { error: p.error };
  return runAction(
    () => setFreeze(admin.id, p.data.frozen),
    p.data.frozen ? "Publication automatique suspendue : tout part en revue manuelle." : "Publication automatique réactivée.",
  );
}
