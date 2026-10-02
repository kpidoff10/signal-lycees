"use server";

import { requireAdmin } from "@/server/admin/auth";
import { parseForm, type ActionState } from "@/server/admin/forms";
import { runAction } from "@/server/admin/run";
import { updateSchool } from "@/server/admin/schools";
import { schoolEditSchema } from "@/server/admin/schemas";

export async function updateSchoolAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin("ADMIN");
  const p = parseForm(schoolEditSchema, fd);
  if (!p.ok) return { error: p.error };
  const { schoolId, ...edit } = p.data;
  return runAction(() => updateSchool(admin.id, schoolId, edit), "Lycée enregistré.");
}
