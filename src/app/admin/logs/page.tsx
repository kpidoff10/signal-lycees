import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/admin/auth";
import { enumParam, first, pageSchema, type SearchParams } from "@/server/admin/forms";
import { LOG_TARGETS } from "@/server/admin/log";
import { listLogs } from "@/server/admin/logs";
import { Pagination } from "../_components/Pagination";
import { Empty, formatDateTime, PageHeader } from "../_components/ui";

export const metadata: Metadata = { title: "Journal" };
export const dynamic = "force-dynamic";

const TARGET_LABEL: Record<(typeof LOG_TARGETS)[number], string> = {
  Issue: "Signalements",
  School: "Lycées",
  AnonymousIdentity: "Identités",
  PrivacyRequest: "Demandes",
  AppSetting: "Réglages",
  AdminUser: "Comptes admin",
  Mobilization: "Mobilisations",
};

function targetHref(type: string, id: string | null): string | null {
  if (!id) return null;
  if (type === "Issue") return `/admin/issues/${id}`;
  if (type === "School") return `/admin/schools/${id}`;
  return null;
}

export default async function LogsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await searchParams;
  const targetType = enumParam(LOG_TARGETS, sp.type);
  const page = pageSchema.parse(first(sp.page));
  const r = await listLogs({ page, targetType });

  return (
    <div>
      <PageHeader title="Journal d'administration" />
      <nav className="sl-chips sl-chips-scroll mb-4" aria-label="Filtrer par type de cible">
        <Link href="/admin/logs" className="sl-chip" aria-pressed={targetType ? "false" : "true"}>
          Tout
        </Link>
        {LOG_TARGETS.map((t) => (
          <Link key={t} href={`/admin/logs?type=${t}`} className="sl-chip" aria-pressed={targetType === t ? "true" : "false"}>
            {TARGET_LABEL[t]}
          </Link>
        ))}
      </nav>
      {r.items.length === 0 ? (
        <Empty>Journal vide.</Empty>
      ) : (
        <ul className="adm-list">
          {r.items.map((l) => {
            const href = targetHref(l.targetType, l.targetId);
            return (
              <li key={l.id} className="adm-row">
                <span className="adm-meta">
                  <span>{formatDateTime(l.createdAt)}</span>
                  <b className="text-ink">{l.action}</b>
                  <span>{l.admin?.username ?? "système / CLI"}</span>
                </span>
                <span className="adm-small">
                  {l.targetType}
                  {l.targetId &&
                    (href ? (
                      <>
                        {" "}
                        <Link href={href} className="link adm-mono">
                          {l.targetId}
                        </Link>
                      </>
                    ) : (
                      <span className="adm-mono"> {l.targetId}</span>
                    ))}
                </span>
                {(l.before != null || l.after != null) && (
                  <details>
                    <summary className="adm-small cursor-pointer py-1">Avant / après</summary>
                    <div className="grid gap-2 md:grid-cols-2">
                      <pre className="adm-pre">{l.before != null ? JSON.stringify(l.before, null, 2) : "—"}</pre>
                      <pre className="adm-pre">{l.after != null ? JSON.stringify(l.after, null, 2) : "—"}</pre>
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={page} pageCount={r.pageCount} total={r.total} basePath="/admin/logs" params={{ type: targetType }} />
    </div>
  );
}
