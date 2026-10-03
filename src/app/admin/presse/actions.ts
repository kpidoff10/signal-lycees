"use server";

import { z } from "zod";
import { requireAdmin } from "@/server/admin/auth";
import { idSchema, parseForm, type ActionState } from "@/server/admin/forms";
import { fetchPressNow, setPressStatus } from "@/server/admin/press";
import { runAction } from "@/server/admin/run";

const idOnly = z.object({ id: idSchema });

export async function publishPressAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(idOnly, fd);
  if (!p.ok) return { error: p.error };
  return runAction(() => setPressStatus(admin.id, p.data.id, "PUBLISHED"), "Article publié.");
}

export async function rejectPressAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const p = parseForm(idOnly, fd);
  if (!p.ok) return { error: p.error };
  return runAction(() => setPressStatus(admin.id, p.data.id, "REJECTED"), "Article écarté.");
}

export async function fetchPressAction(): Promise<ActionState> {
  await requireAdmin();
  let summary = "";
  const res = await runAction(async () => {
    const r = await fetchPressNow();
    const rc = r.rechecked;
    summary =
      ("PUBLISHED" in r ? `${r.added} nouveaux : ${r.PUBLISHED} publiés, ${r.PENDING} à vérifier, ${r.REJECTED} écartés.` : "Aucun nouvel article.") +
      (rc.PUBLISHED + rc.PENDING + rc.REJECTED ? ` Double vérification d'articles en attente : ${rc.PUBLISHED} publiés, ${rc.REJECTED} écartés, ${rc.PENDING} restent à vérifier.` : "");
  }, "");
  return res.ok ? { ok: true, message: summary } : res;
}
