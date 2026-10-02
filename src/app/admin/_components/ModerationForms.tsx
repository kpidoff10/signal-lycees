import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { DESCRIPTION_MAX, DESCRIPTION_MIN, TITLE_MAX, TITLE_MIN } from "@/lib/schemas";
import { REFUSAL_CODES, REFUSAL_REASONS, REFUSAL_SHORT } from "@/server/admin/labels";
import { editPublishAction, keepPublishedAction, publishAction, rejectAction } from "../moderation/actions";
import { ActionForm } from "./ActionForm";
import { InternalReasonField, Submit } from "./ui";

interface IssueRef {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
}

export function PublishForm({ issueId }: { issueId: string }) {
  return (
    <ActionForm action={publishAction}>
      <input type="hidden" name="issueId" value={issueId} />
      <InternalReasonField />
      <div>
        <Submit>Publier</Submit>
      </div>
    </ActionForm>
  );
}

export function KeepPublishedForm({ issueId }: { issueId: string }) {
  return (
    <ActionForm action={keepPublishedAction}>
      <input type="hidden" name="issueId" value={issueId} />
      <InternalReasonField />
      <div>
        <Submit>Laisser publié</Submit>
      </div>
    </ActionForm>
  );
}

export function EditPublishForm({ issue, published }: { issue: IssueRef; published: boolean }) {
  return (
    <details className="adm-details">
      <summary>{published ? "Modifier le texte publié" : "Modifier et publier"}</summary>
      <div className="adm-details-body">
        <ActionForm action={editPublishAction}>
          <input type="hidden" name="issueId" value={issue.id} />
          <label className="adm-label">
            Catégorie
            <select name="category" className="field" defaultValue={issue.category}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="adm-label">
            <span>
              Titre <span className="adm-hint">({TITLE_MIN} à {TITLE_MAX} caractères)</span>
            </span>
            <input name="title" className="field" defaultValue={issue.title} minLength={TITLE_MIN} maxLength={TITLE_MAX} required />
          </label>
          <label className="adm-label">
            <span>
              Description <span className="adm-hint">({DESCRIPTION_MIN} à {DESCRIPTION_MAX} caractères)</span>
            </span>
            <textarea
              name="description"
              className="field"
              rows={6}
              defaultValue={issue.description}
              minLength={DESCRIPTION_MIN}
              maxLength={DESCRIPTION_MAX}
              required
            />
          </label>
          <InternalReasonField />
          <div>
            <Submit>{published ? "Enregistrer (reste publié)" : "Modifier et publier"}</Submit>
          </div>
        </ActionForm>
      </div>
    </details>
  );
}

export function RejectForm({ issueId, published }: { issueId: string; published: boolean }) {
  return (
    <details className="adm-details">
      <summary>{published ? "Dépublier" : "Refuser"}</summary>
      <div className="adm-details-body">
        <ActionForm action={rejectAction} confirmMessage={published ? "Dépublier ce signalement ?" : undefined}>
          <input type="hidden" name="issueId" value={issueId} />
          <fieldset className="adm-form">
            <legend className="adm-label mb-2">Motif public (communiqué à l&apos;auteur)</legend>
            {REFUSAL_CODES.map((code) => (
              <label key={code} className="flex items-start gap-2 text-[15px] leading-[21px]">
                <input type="radio" name="reasonCode" value={code} required className="mt-1 h-5 w-5 flex-none accent-[var(--signal)]" />
                <span>
                  <b>{REFUSAL_SHORT[code]}</b>
                  {REFUSAL_REASONS[code] && <span className="block adm-small adm-muted">{REFUSAL_REASONS[code]}</span>}
                </span>
              </label>
            ))}
          </fieldset>
          <label className="adm-label">
            <span>
              Précision publique <span className="adm-hint">(ajoutée au motif ; obligatoire pour « Autre »)</span>
            </span>
            <textarea name="reasonText" className="field" rows={3} maxLength={500} />
          </label>
          <InternalReasonField />
          <div>
            <Submit variant="danger">{published ? "Dépublier" : "Refuser"}</Submit>
          </div>
        </ActionForm>
      </div>
    </details>
  );
}
