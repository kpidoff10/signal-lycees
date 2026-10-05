"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/admin/auth";
import type { ActionState } from "@/server/admin/forms";
import { fetchPressNow } from "@/server/admin/press";
import { researchInProgress, runResearchJob } from "@/server/research/job";

/** Lance la recherche en tâche de fond (une à deux minutes) : le résultat apparaît dans l'historique. */
export async function runResearchAction(): Promise<ActionState> {
  const admin = await requireAdmin();
  if (await researchInProgress()) return { error: "Une recherche est déjà en cours : son résultat arrive dans l'historique." };
  after(() => runResearchJob({ trigger: "MANUAL", adminId: admin.id }).catch((e) => console.error("research", e instanceof Error ? e.message : e)));
  return { ok: true, message: "Recherche lancée : résultat dans une à deux minutes (recharge la page)." };
}

export async function runPressAction(): Promise<ActionState> {
  const admin = await requireAdmin();
  try {
    const r = await fetchPressNow(admin.id);
    revalidatePath("/admin/imports");
    return { ok: true, message: "PUBLISHED" in r ? `${r.added} nouvel(s) article(s) : ${r.PUBLISHED} publié(s), ${r.PENDING} à vérifier.` : "Aucun nouvel article." };
  } catch (e) {
    return { error: e instanceof Error ? e.message.slice(0, 200) : "Échec de la revue de presse." };
  }
}
