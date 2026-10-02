import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/admin/auth";
import { first, pageSchema, textParam, type SearchParams } from "@/server/admin/forms";
import { listSchools, schoolFacets } from "@/server/admin/schools";
import { Pagination } from "../_components/Pagination";
import { Badge, Empty, PageHeader } from "../_components/ui";

export const metadata: Metadata = { title: "Lycées" };
export const dynamic = "force-dynamic";

export default async function SchoolsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await searchParams;
  const facets = await schoolFacets();
  const region = textParam(sp.region, 120);
  const academy = textParam(sp.academy, 120);
  const filters = {
    q: textParam(sp.q),
    region: facets.regions.includes(region) ? region : undefined,
    academy: facets.academies.includes(academy) ? academy : undefined,
    page: pageSchema.parse(first(sp.page)),
  };
  const r = await listSchools(filters);

  return (
    <div>
      <PageHeader title="Lycées" />
      <form method="get" className="adm-filters" role="search">
        <label className="adm-label">
          Recherche
          <input name="q" className="field" defaultValue={filters.q} placeholder="Nom, ville, code postal ou UAI" maxLength={80} />
        </label>
        <label className="adm-label">
          Région
          <select name="region" className="field" defaultValue={filters.region ?? ""}>
            <option value="">Toutes</option>
            {facets.regions.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="adm-label">
          Académie
          <select name="academy" className="field" defaultValue={filters.academy ?? ""}>
            <option value="">Toutes</option>
            {facets.academies.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="sl-btn sl-btn-secondary">
          Filtrer
        </button>
      </form>
      {r.items.length === 0 ? (
        <Empty>Aucun lycée ne correspond.</Empty>
      ) : (
        <ul className="adm-list">
          {r.items.map((s) => (
            <li key={s.id}>
              <Link href={`/admin/schools/${s.id}`} className="adm-row">
                <span className="adm-row-title">{s.name}</span>
                <span className="adm-meta">
                  <span>
                    {s.postalCode} {s.city}
                  </span>
                  <span className="adm-mono">{s.uai}</span>
                  <span>{s.academy ?? s.region}</span>
                  <span className="num">{s._count.issues} signalement(s)</span>
                  {!s.isOpen && <Badge tone="outline">Fermé</Badge>}
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
        basePath="/admin/schools"
        params={{ q: filters.q, region: filters.region, academy: filters.academy }}
      />
    </div>
  );
}
