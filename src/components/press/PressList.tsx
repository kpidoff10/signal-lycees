import Link from "next/link";
import type { PublicArticle } from "@/server/press";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });

/** Liste d'articles : titre (lien vers le média), source, date. Aucun contenu repris. */
export function PressList({ articles, cityNames, showDate = true }: { articles: PublicArticle[]; cityNames?: Map<string, string>; showDate?: boolean }) {
  return (
    <ul className="grid gap-3">
      {articles.map((a) => (
        <li key={a.id} className="grid gap-1 rounded-lg border border-border bg-surface px-4 py-3">
          <a href={a.url} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold leading-snug hover:text-signal-ink hover:underline">
            {a.title}
            <span className="sr-only"> (ouvre le site du média)</span>
          </a>
          <span className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-muted">
            <span>{a.source}</span>
            {showDate && <span>{dateFmt.format(a.publishedAt)}</span>}
            {a.citySlug && cityNames?.get(a.citySlug) && (
              <Link href={`/ville/${a.citySlug}`} className="underline hover:text-signal-ink">
                {cityNames.get(a.citySlug)}
              </Link>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
