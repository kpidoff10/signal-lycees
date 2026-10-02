import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { hasRole, requireAdmin } from "@/server/admin/auth";
import { idSchema } from "@/server/admin/forms";
import { getIssueDetail } from "@/server/admin/issues";
import { ISSUE_STATUSES, ISSUE_STATUS_LABEL, MODERATION_STATUS_LABEL, REPORT_REASON_LABEL } from "@/server/admin/labels";
import { ActionForm } from "../../_components/ActionForm";
import { DeleteForm } from "../../_components/DeleteForm";
import { EditPublishForm, PublishForm, RejectForm } from "../../_components/ModerationForms";
import { Badge, formatDateTime, ModerationBadge, PageHeader, StatusBadge, Submit } from "../../_components/ui";
import { deleteIssueAction, statusAction } from "../actions";

export const metadata: Metadata = { title: "Fiche signalement" };
export const dynamic = "force-dynamic";

const EVENT_LABEL = {
  CREATED: "Création",
  PUBLISHED: "Publication",
  STATUS_CHANGED: "Changement de statut",
  CONFIRMATION_MILESTONE: "Palier de confirmations",
  STILL_PRESENT: "Toujours présent",
} as const;

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const issue = await getIssueDetail(id.data);
  if (!issue) notFound();
  const isPublic = issue.moderationStatus === "PUBLISHED" || issue.moderationStatus === "AUTO_APPROVED";

  return (
    <div className="adm-stack">
      <p className="m-0">
        <Link href="/admin/issues" className="link">
          ← Signalements
        </Link>
      </p>
      <PageHeader title="Fiche signalement" />

      <article className={`adm-card${issue.reviewPriority === "URGENT" ? " adm-urgent" : ""}`}>
        <div className="adm-meta">
          {issue.reviewPriority === "URGENT" && <Badge tone="strong">URGENT</Badge>}
          <ModerationBadge status={issue.moderationStatus} />
          <StatusBadge status={issue.status} />
          <CategoryBadge id={issue.category} />
          {issue.flaggedForReview && <Badge tone="signal">👎 à revoir</Badge>}
        </div>
        <p className="mt-3 mb-1 text-[14px] font-semibold">
          {issue.school.name} <span className="adm-muted font-normal">· {issue.school.postalCode} {issue.school.city}</span>
        </p>
        <h2 className="m-0 text-[19px] font-bold leading-[25px] user-text">{issue.title}</h2>
        <p className="mt-2 mb-0 text-[15px] leading-[22px] user-text">{issue.description}</p>

        {!issue.originalPurgedAt && issue.originalTitle && (issue.originalTitle !== issue.title || issue.originalDescription !== issue.description) && (
          <div className="adm-section">
            <h3 className="adm-h2">Texte original</h3>
            <div className="adm-quote">
              <p className="m-0 font-bold user-text">{issue.originalTitle}</p>
              <p className="mt-1 mb-0 user-text">{issue.originalDescription}</p>
            </div>
          </div>
        )}

        <div className="adm-section">
          <dl className="adm-dl">
            <dt>Id</dt>
            <dd className="adm-mono">{issue.id}</dd>
            <dt>Déposé</dt>
            <dd>{formatDateTime(issue.createdAt)}</dd>
            <dt>Publié</dt>
            <dd>{formatDateTime(issue.publishedAt)}</dd>
            <dt>Statut changé</dt>
            <dd>{formatDateTime(issue.statusChangedAt)}</dd>
            <dt>Résolu</dt>
            <dd>{formatDateTime(issue.resolvedAt)}</dd>
            <dt>Votes</dt>
            <dd className="num">
              👍 {issue.upCount} · 👎 {issue.downCount} · « résolu » {issue.resolvedVoteCount}
            </dd>
            <dt>Gravité</dt>
            <dd>{issue.severity ?? "—"}</dd>
            <dt>Original purgé</dt>
            <dd>{formatDateTime(issue.originalPurgedAt)}</dd>
          </dl>
        </div>
      </article>

      <section className="adm-card adm-form" aria-labelledby="actions-h">
        <h2 id="actions-h" className="adm-h2">
          Actions
        </h2>
        <ActionForm action={statusAction}>
          <input type="hidden" name="issueId" value={issue.id} />
          <label className="adm-label">
            Statut public
            <select name="status" className="field" defaultValue={issue.status}>
              {ISSUE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ISSUE_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <div>
            <Submit variant="secondary">Changer le statut</Submit>
          </div>
        </ActionForm>
        {isPublic ? (
          <>
            <EditPublishForm issue={issue} published />
            <RejectForm issueId={issue.id} published />
          </>
        ) : (
          <>
            {issue.moderationStatus === "REJECTED" && <p className="adm-small adm-muted m-0">Refusé : publier revient sur le refus.</p>}
            <PublishForm issueId={issue.id} />
            <EditPublishForm issue={issue} published={false} />
            {issue.moderationStatus !== "REJECTED" && <RejectForm issueId={issue.id} published={false} />}
          </>
        )}
        {hasRole(admin.role, "ADMIN") && <DeleteForm action={deleteIssueAction} hidden={{ issueId: issue.id }} label="Supprimer définitivement" />}
      </section>

      <section className="adm-card" aria-labelledby="dec-h">
        <h2 id="dec-h" className="adm-h2">
          Décisions de modération
        </h2>
        {issue.decisions.length === 0 ? (
          <p className="adm-small adm-muted m-0">Aucune.</p>
        ) : (
          <ul className="adm-list">
            {issue.decisions.map((d) => (
              <li key={d.id} className="adm-row">
                <span className="adm-meta">
                  <span>{formatDateTime(d.createdAt)}</span>
                  <span>{d.admin?.username ?? "automatique"}</span>
                  <span>
                    {MODERATION_STATUS_LABEL[d.fromStatus]} → <b>{MODERATION_STATUS_LABEL[d.toStatus]}</b>
                  </span>
                  {d.editedTitle && <Badge>texte modifié</Badge>}
                </span>
                {d.publicReason && <span className="adm-small user-text">Motif public : {d.publicReason}</span>}
                {d.internalReason && <span className="adm-small adm-muted user-text">Interne : {d.internalReason}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {issue.contentReports.length > 0 && (
        <section className="adm-card" aria-labelledby="rep-h">
          <h2 id="rep-h" className="adm-h2">
            Signalements de contenu
          </h2>
          <ul className="adm-list">
            {issue.contentReports.map((r) => (
              <li key={r.id} className="adm-row">
                <span className="adm-meta">
                  <b>{REPORT_REASON_LABEL[r.reason]}</b>
                  <Badge tone={r.status === "OPEN" ? "signal" : undefined}>{r.status === "OPEN" ? "Ouvert" : r.status === "RESOLVED" ? "Traité" : "Classé"}</Badge>
                  <span>{formatDateTime(r.createdAt)}</span>
                </span>
                {r.comment && <span className="adm-small user-text">{r.comment}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="adm-card" aria-labelledby="ev-h">
        <h2 id="ev-h" className="adm-h2">
          Historique public
        </h2>
        <ul className="m-0 grid gap-1 pl-5 text-[14px] leading-[20px]">
          {issue.events.map((e) => (
            <li key={e.id}>
              {formatDateTime(e.createdAt)} — {EVENT_LABEL[e.type]}
              {e.data != null && <span className="adm-muted adm-mono"> {JSON.stringify(e.data)}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
