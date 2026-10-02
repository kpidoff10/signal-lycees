"use client";

import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { category, type CategoryId } from "@/lib/categories";
import { formatDay, formatNumber, plural, quote } from "@/lib/format";

export interface SchoolDetail {
  id: string;
  slug: string;
  name: string;
  city: string;
  postalCode: string;
  active: number;
  confirmations: number;
  categories: { id: CategoryId; count: number }[];
  top: { id: string; title: string; category: CategoryId; upCount: number } | null;
  mobilization: { happenedOn: string; reasons: string | null; sourceName: string | null; sourceUrl: string | null; origin: "STUDENT" | "PRESS" | "ADMIN" } | null;
}

function MobLine({ d }: { d: SchoolDetail }) {
  if (!d.mobilization) return null;
  return (
    <p className="mt-2 flex items-start gap-1.5 rounded-[var(--radius-sm)] bg-signal-soft px-2.5 py-1.5 text-[13px] font-semibold text-signal-ink">
      <span aria-hidden="true">📣</span>
      <span>
        Mobilisation signalée le {formatDay(new Date(d.mobilization.happenedOn))}
        {d.mobilization.sourceName ? ` (${d.mobilization.sourceName})` : ""}
      </span>
    </p>
  );
}

function Figures({ d }: { d: SchoolDetail }) {
  return (
    <div className="sl-card-figures">
      <div className="sl-fig-signal">
        <span className="sl-fig-value">{formatNumber(d.active)}</span>
        <span className="sl-fig-label">{plural(d.active, "problème actif", "problèmes actifs")}</span>
      </div>
      <div>
        <span className="sl-fig-value">{formatNumber(d.confirmations)}</span>
        <span className="sl-fig-label">{plural(d.confirmations, "confirmation")}</span>
      </div>
    </div>
  );
}

function Details({ d }: { d: SchoolDetail }) {
  return (
    <>
      {d.categories.length > 0 && (
        <>
          <p className="sl-card-h">Principaux problèmes</p>
          <ul className="sl-cats">
            {d.categories.slice(0, 4).map((c) => (
              <li key={c.id}>
                <span aria-hidden="true">{category(c.id).emoji}</span>
                {category(c.id).label}
                <span className="n">{c.count}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {d.top && (
        <>
          <p className="sl-card-h">Problème le plus confirmé</p>
          <div className="sl-top">
            <p className="sl-top-title">{quote(d.top.title)}</p>
            <p className="sl-top-meta">
              <b>{formatNumber(d.top.upCount)}</b> {plural(d.top.upCount, "confirmation")} · <span aria-hidden="true">{category(d.top.category).emoji}</span>{" "}
              {category(d.top.category).label}
            </p>
          </div>
        </>
      )}
    </>
  );
}

/** Card flottante (desktop). */
export function SchoolCard({ d, onClose }: { d: SchoolDetail; onClose: () => void }) {
  return (
    <section className="sl-card" aria-label={`Lycée ${d.name}`}>
      <div className="sl-card-head">
        <div className="sl-card-titles">
          <h3 className="sl-card-name">{d.name}</h3>
          <p className="sl-card-city">
            {d.city} — {d.postalCode}
          </p>
          <MobLine d={d} />
        </div>
        <button type="button" className="sl-card-close" aria-label="Fermer" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <Figures d={d} />
      <Details d={d} />
      <div className="sl-card-actions">
        <ButtonLink href={`/lycee/${d.slug}`} block>
          Voir ce lycée
        </ButtonLink>
        <ButtonLink href={`/signaler?lycee=${d.slug}`} variant="secondary" block>
          Signaler un problème
        </ButtonLink>
      </div>
    </section>
  );
}

/** Bottom sheet (mobile) : glisser ou toucher la poignée pour plus de détails. */
export function SchoolSheet({
  d,
  expanded,
  onExpand,
  onClose,
}: {
  d: SchoolDetail;
  expanded: boolean;
  onExpand: (v: boolean) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className={`sl-scrim${expanded ? " is-on" : ""}`} onClick={() => onExpand(false)} aria-hidden="true" />
      <section
        className={`sl-sheet${expanded ? " is-expanded" : ""}`}
        aria-label={`Lycée ${d.name}`}
        onTouchStart={(e) => ((e.currentTarget as HTMLElement).dataset.y = String(e.touches[0]!.clientY))}
        onTouchEnd={(e) => {
          const start = Number((e.currentTarget as HTMLElement).dataset.y);
          const dy = e.changedTouches[0]!.clientY - start;
          if (dy < -40) onExpand(true);
          else if (dy > 60) {
            if (expanded) onExpand(false);
            else onClose();
          }
        }}
      >
        <button
          type="button"
          className="sl-sheet-grip"
          aria-label={expanded ? "Réduire" : "Afficher plus de détails"}
          aria-expanded={expanded}
          onClick={() => onExpand(!expanded)}
        />
        <div className="sl-card-head">
          <div className="sl-card-titles">
            <h3 className="sl-card-name">{d.name}</h3>
            <p className="sl-card-city">{d.city}</p>
            <MobLine d={d} />
          </div>
          <button type="button" className="sl-card-close" aria-label="Fermer" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <Figures d={d} />
        <div className="sl-sheet-actions">
          <ButtonLink href={`/lycee/${d.slug}`} block>
            Voir les problèmes
          </ButtonLink>
          <ButtonLink href={`/signaler?lycee=${d.slug}`} variant="secondary" block>
            Signaler un problème
          </ButtonLink>
        </div>
        <div className="sl-sheet-more" hidden={!expanded}>
          <Details d={d} />
        </div>
      </section>
    </>
  );
}
