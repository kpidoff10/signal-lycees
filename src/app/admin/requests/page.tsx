import type { Metadata } from "next";
import Link from "next/link";
import { hasRole, requireAdmin } from "@/server/admin/auth";
import { enumParam, first, pageSchema, type SearchParams } from "@/server/admin/forms";
import { listRequests } from "@/server/admin/requests";
import { ActionForm } from "../_components/ActionForm";
import { DeleteForm } from "../_components/DeleteForm";
import { Pagination } from "../_components/Pagination";
import { Badge, Empty, formatDateTime, ModerationBadge, PageHeader, Submit } from "../_components/ui";
import { deleteRequestedIssueAction, handledAction } from "./actions";

export const metadata: Metadata = { title: "Demandes" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "", label: "À traiter" },
  { value: "done", label: "Traitées" },
  { value: "all", label: "Toutes" },
] as const;

export default async function RequestsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const filter = enumParam(["done", "all"] as const, sp.filter);
  const page = pageSchema.parse(first(sp.page));
  const r = await listRequests({ page, handled: filter === "all" ? undefined : filter === "done" });
  const isAdmin = hasRole(admin.role, "ADMIN");

  return (
    <div>
      <PageHeader title="Demandes de suppression et de contact" sub="Demandes RGPD / DSA envoyées sans compte. Les plus anciennes d'abord." />
      <nav className="sl-chips mb-4" aria-label="Filtrer">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/requests?filter=${f.value}` : "/admin/requests"}
            className="sl-chip"
            aria-pressed={(filter ?? "") === f.value ? "true" : "false"}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      {r.items.length === 0 ? (
        <Empty>Aucune demande.</Empty>
      ) : (
        <ul className="adm-list">
          {r.items.map((q) => (
            <li key={q.id} className="adm-row" style={{ gap: "var(--space-2)" }}>
              <span className="adm-meta">
                <Badge tone={q.kind === "DELETION" ? "signal" : undefined}>{q.kind === "DELETION" ? "Suppression" : "Contact"}</Badge>
                {q.handled ? <Badge tone="ok">Traitée</Badge> : <Badge tone="outline">À traiter</Badge>}
                <span>{formatDateTime(q.createdAt)}</span>
              </span>
              <p className="m-0 text-[15px] leading-[22px] user-text">{q.message}</p>
              {q.contact && (
                <p className="m-0 adm-small">
                  Contact fourni : <span className="user-text">{q.contact}</span>
                </p>
              )}
              {q.issueId && (
                <p className="m-0 adm-small">
                  Signalement visé :{" "}
                  {q.issue ? (
                    <>
                      <Link href={`/admin/issues/${q.issue.id}`} className="link user-text">
                        {q.issue.title}
                      </Link>{" "}
                      <span className="adm-muted">({q.issue.school.name})</span> <ModerationBadge status={q.issue.moderationStatus} />
                    </>
                  ) : (
                    <span className="adm-muted">
                      introuvable ou déjà supprimé (<span className="adm-mono">{q.issueId}</span>)
                    </span>
                  )}
                </p>
              )}
              <div className="adm-actions">
                <ActionForm action={handledAction} className="adm-form">
                  <input type="hidden" name="requestId" value={q.id} />
                  <input type="hidden" name="handled" value={q.handled ? "0" : "1"} />
                  <Submit variant="secondary">{q.handled ? "Rouvrir" : "Marquer traitée"}</Submit>
                </ActionForm>
              </div>
              {q.kind === "DELETION" && q.issue && isAdmin && (
                <DeleteForm action={deleteRequestedIssueAction} hidden={{ requestId: q.id }} label="Supprimer le signalement" />
              )}
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={r.pageCount} total={r.total} basePath="/admin/requests" params={{ filter }} />
    </div>
  );
}
