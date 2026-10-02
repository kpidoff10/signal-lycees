"use server";

import { redirect } from "next/navigation";
import { login } from "@/server/admin/auth";
import { parseForm, type ActionState } from "@/server/admin/forms";
import { loginSchema } from "@/server/admin/schemas";

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const p = parseForm(loginSchema, fd);
  if (!p.ok) return { error: "Identifiants ou code incorrects." };
  const r = await login(p.data);
  if (!r.ok) return { error: r.error };
  redirect("/admin");
}
