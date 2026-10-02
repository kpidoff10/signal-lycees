"use server";

import { requireAdmin } from "@/server/admin/auth";
import { parseForm, type ActionState } from "@/server/admin/forms";
import { runAction } from "@/server/admin/run";
import { banSchema } from "@/server/admin/schemas";
import { setBanned } from "@/server/admin/users";

export async function banAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(banSchema, fd);
  if (!p.ok) return { error: p.error };
  return runAction(() => setBanned(admin.id, p.data.identityId, p.data.banned), p.data.banned ? "Identité bannie." : "Identité débannie.");
}
