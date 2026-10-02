import Link from "next/link";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { formatNumber, plural, timeAgo } from "@/lib/format";
import type { LatestIssue } from "@/server/stats";

function Card({ i, className = "" }: { i: LatestIssue; className?: string }) {
  return (
    <Link
      href={`/probleme/${i.id}`}
      className={`block rounded-[20px] border border-border bg-surface p-4 shadow-float transition-transform hover:-translate-y-0.5 ${className}`}
    >
      <span className="flex items-center justify-between gap-3 text-[12px] text-ink-muted">
        <CategoryBadge id={i.category} />
        <span className="shrink-0">{timeAgo(i.publishedAt)}</span>
      </span>
      <span className="mt-2.5 block font-display text-[17px] font-bold leading-[22px]">{i.title}</span>
      <span className="mt-2 flex flex-wrap items-center gap-x-2 text-[13px] text-ink-muted">
        <span>À {i.city}</span>
        {i.upCount > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span>
              <b className="num text-signal-ink">{formatNumber(i.upCount)}</b> {plural(i.upCount, "confirmation")}
            </span>
          </>
        )}
        {i.press && (
          <>
            <span aria-hidden="true">·</span>
            <span>repris de la presse</span>
          </>
        )}
      </span>
    </Link>
  );
}

/** Aperçu de l'accueil : les derniers signalements, sans nommer le lycée. */
export function LatestIssues({ items }: { items: LatestIssue[] }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="derniers-titre">
      <p id="derniers-titre" className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] text-ink-muted">
        <span className="sl-live-dot" aria-hidden="true" />
        Derniers signalements
      </p>
      {/* Ordinateur : cartes empilées en quinconce. */}
      <ul className="hidden gap-3 lg:grid">
        {items.map((i, k) => (
          <li key={i.id} className={k % 2 ? "pl-10" : "pr-10"}>
            <Card i={i} />
          </li>
        ))}
      </ul>
      {/* Mobile : défilement horizontal. */}
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:hidden">
        {items.map((i) => (
          <li key={i.id} className="w-[78%] shrink-0 snap-start">
            <Card i={i} className="h-full !shadow-none" />
          </li>
        ))}
      </ul>
    </section>
  );
}
