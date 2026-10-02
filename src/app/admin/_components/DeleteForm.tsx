import type { ActionState } from "@/server/admin/forms";
import { ActionForm } from "./ActionForm";
import { Submit } from "./ui";

/** Suppression définitive : saisie de « SUPPRIMER » vérifiée côté serveur + confirmation. */
export function DeleteForm({
  action,
  hidden,
  label,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  hidden: Record<string, string>;
  label: string;
}) {
  return (
    <details className="adm-details">
      <summary>{label}</summary>
      <div className="adm-details-body">
        <p className="m-0 text-[14px] leading-[20px]">
          Suppression <b>définitive</b> : texte, votes, historique et analyses disparaissent. Irréversible.
        </p>
        <ActionForm action={action} confirmMessage="Supprimer définitivement ? Cette action est irréversible.">
          {Object.entries(hidden).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <label className="adm-label">
            <span>
              Tape <b>SUPPRIMER</b> pour confirmer
            </span>
            <input name="confirm" className="field" autoComplete="off" autoCapitalize="characters" required pattern="SUPPRIMER" />
          </label>
          <div>
            <Submit variant="danger">{label}</Submit>
          </div>
        </ActionForm>
      </div>
    </details>
  );
}
