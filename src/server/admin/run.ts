import "server-only";
import { revalidatePath } from "next/cache";
import { AdminError, type ActionState } from "./forms";

/** Exécute une mutation admin et traduit le résultat pour le formulaire. */
export async function runAction(fn: () => Promise<unknown>, message: string): Promise<ActionState> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof AdminError) return { error: e.message };
    console.error("[admin]", e);
    return { error: "Erreur inattendue : rien n'a été modifié, ou partiellement. Recharge la page." };
  }
  // Pages publiques et admin : les données ont changé.
  revalidatePath("/", "layout");
  return { ok: true, message };
}
