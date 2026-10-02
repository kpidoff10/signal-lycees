import Link from "next/link";

/** Liens précédent / suivant qui conservent les filtres. */
export function Pagination({
  page,
  pageCount,
  total,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  total: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav className="adm-pager" aria-label="Pagination">
      {page > 1 ? (
        <Link className="sl-btn sl-btn-secondary sl-btn-sm" href={href(page - 1)} rel="prev">
          Précédent
        </Link>
      ) : (
        <span />
      )}
      <span className="num">
        Page {Math.min(page, pageCount)} sur {pageCount} · {total.toLocaleString("fr-FR")} au total
      </span>
      {page < pageCount ? (
        <Link className="sl-btn sl-btn-secondary sl-btn-sm" href={href(page + 1)} rel="next">
          Suivant
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
