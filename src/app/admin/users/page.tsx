import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/admin/auth";
import { enumParam, first, pageSchema, type SearchParams } from "@/server/admin/forms";
import { listIdentities } from "@/server/admin/users";
import { ActionForm } from "../_components/ActionForm";
import { Pagination } from "../_components/Pagination";
import { Badge, Empty, formatDateTime, PageHeader, Submit } from "../_components/ui";
import { banAction } from "./actions";

export const metadata: Metadata = { title: "Identités anonymes" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "", label: "Toutes" },
  { value: "banned", label: "Bannies" },
  { value: "active", label: "Actives" },
] as const;

export default async function UsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = enumParam(["banned", "active"] as const, sp.filter);
  const page = pageSchema.parse(first(sp.page));
  const r = await listIdentities({ page, banned: filter === undefined ? undefined : filter === "banned" });

  return (
    <div>
      <PageHeader
        title="Identités anonymes"
        sub="Aucune donnée nominative : une identité n'est qu'un identifiant aléatoire porté par un cookie. Bannir empêche cet appareil de déposer, voter ou confirmer."
      />
      <nav className="sl-chips mb-4" aria-label="Filtrer">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/users?filter=${f.value}` : "/admin/users"}
            className="sl-chip"
            aria-pressed={(filter ?? "") === f.value ? "true" : "false"}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      {r.items.length === 0 ? (
        <Empty>Aucune identité.</Empty>
      ) : (
        <ul className="adm-list">
          {r.items.map((u) => (
            <li key={u.id} className="adm-row">
              <span className="adm-meta">
                <span className="adm-mono" title="Identifiant tronqué">
                  …{u.id.slice(-8)}
                </span>
                {u.banned && <Badge tone="strong">Bannie</Badge>}
                <span className="num">
                  {u._count.issues} signalement(s) · {u._count.votes} vote(s)
                </span>
              </span>
              <span className="adm-small adm-muted">
                Créée le {formatDateTime(u.createdAt)} · dernière activité {formatDateTime(u.lastSeen)}
              </span>
              <ActionForm
                action={banAction}
                className="adm-form mt-1"
                confirmMessage={u.banned ? "Débannir cette identité ?" : "Bannir cette identité ? Elle ne pourra plus participer."}
              >
                <input type="hidden" name="identityId" value={u.id} />
                <input type="hidden" name="banned" value={u.banned ? "0" : "1"} />
                <div>
                  <Submit variant={u.banned ? "secondary" : "danger"}>{u.banned ? "Débannir" : "Bannir"}</Submit>
                </div>
              </ActionForm>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={r.pageCount} total={r.total} basePath="/admin/users" params={{ filter }} />
    </div>
  );
}
