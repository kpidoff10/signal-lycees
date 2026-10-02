import type { Metadata } from "next";
import Link from "next/link";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/categories";
import { requireAdmin } from "@/server/admin/auth";
import { enumParam, first, pageSchema, textParam, type SearchParams } from "@/server/admin/forms";
import { listIssues } from "@/server/admin/issues";
import { ISSUE_STATUSES, ISSUE_STATUS_LABEL, MODERATION_STATUSES, MODERATION_STATUS_LABEL } from "@/server/admin/labels";
import { Pagination } from "../_components/Pagination";
import { Badge, Empty, formatDate, ModerationBadge, PageHeader, StatusBadge } from "../_components/ui";

export const metadata: Metadata = { title: "Signalements" };
export const dynamic = "force-dynamic";

export default async function IssuesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filters = {
    q: textParam(sp.q),
    status: enumParam(ISSUE_STATUSES, sp.status),
    moderationStatus: enumParam(MODERATION_STATUSES, sp.moderation),
    category: enumParam(CATEGORY_IDS, sp.category),
    page: pageSchema.parse(first(sp.page)),
  };
  const r = await listIssues(filters);

  return (
    <div>
      <PageHeader title="Signalements" />
      <form method="get" className="adm-filters" role="search">
        <label className="adm-label">
          Recherche
          <input name="q" className="field" defaultValue={filters.q} placeholder="Titre, lycée, ville ou id" maxLength={80} />
        </label>
        <label className="adm-label">
          Statut public
          <select name="status" className="field" defaultValue={filters.status ?? ""}>
            <option value="">Tous</option>
            {ISSUE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ISSUE_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="adm-label">
          Modération
          <select name="moderation" className="field" defaultValue={filters.moderationStatus ?? ""}>
            <option value="">Tous</option>
            {MODERATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {MODERATION_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="adm-label">
          Catégorie
          <select name="category" className="field" defaultValue={filters.category ?? ""}>
            <option value="">Toutes</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="sl-btn sl-btn-secondary">
          Filtrer
        </button>
      </form>

      {r.items.length === 0 ? (
        <Empty>Aucun signalement ne correspond.</Empty>
      ) : (
        <ul className="adm-list">
          {r.items.map((i) => (
            <li key={i.id}>
              <Link href={`/admin/issues/${i.id}`} className="adm-row">
                <span className="adm-row-title user-text">{i.title}</span>
                <span className="adm-small adm-muted">
                  {i.school.name} · {i.school.city}
                </span>
                <span className="adm-meta">
                  <ModerationBadge status={i.moderationStatus} />
                  <StatusBadge status={i.status} />
                  <CategoryBadge id={i.category} />
                  {i.reviewPriority === "URGENT" && <Badge tone="strong">URGENT</Badge>}
                  {i.flaggedForReview && <Badge tone="signal">👎 à revoir</Badge>}
                  <span className="num">
                    👍 {i.upCount} · 👎 {i.downCount}
                  </span>
                  <span>{formatDate(i.createdAt)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination
        page={filters.page}
        pageCount={r.pageCount}
        total={r.total}
        basePath="/admin/issues"
        params={{ q: filters.q, status: filters.status, moderation: filters.moderationStatus, category: filters.category }}
      />
    </div>
  );
}
