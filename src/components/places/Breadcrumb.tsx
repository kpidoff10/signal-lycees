import Link from "next/link";
import { publicEnv } from "@/lib/env";

export interface Crumb {
  label: string;
  href?: string;
}

/** Fil d'Ariane visible et sa version pour les moteurs de recherche (BreadcrumbList). */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const base = publicEnv.siteUrl.replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, ...(c.href ? { item: `${base}${c.href}` } : {}) })),
  };
  return (
    <nav aria-label="Fil d’Ariane" className="text-sm">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ol className="flex flex-wrap items-center gap-2 text-ink-muted">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">›</span>}
            {c.href ? (
              <Link href={c.href} className="link">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
