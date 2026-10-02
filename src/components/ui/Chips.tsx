"use client";

import { CATEGORIES, type CategoryId } from "@/lib/categories";

export function Chip({
  label,
  emoji,
  selected,
  count,
  onClick,
}: {
  label: string;
  emoji?: string;
  selected?: boolean;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="sl-chip" aria-pressed={selected ? "true" : "false"} onClick={onClick}>
      {emoji && (
        <span className="sl-chip-emoji" aria-hidden="true">
          {emoji}
        </span>
      )}
      {label}
      {count !== undefined && <span className="sl-chip-count">{count}</span>}
    </button>
  );
}

/** Chips de catégories, multi-sélection ; « Tous » réinitialise. */
export function CategoryChips({
  value,
  onChange,
  counts,
  scroll,
  only,
  ariaLabel = "Filtrer par catégorie",
}: {
  value: CategoryId[];
  onChange: (v: CategoryId[]) => void;
  counts?: Partial<Record<CategoryId, number>>;
  scroll?: boolean;
  /** N'afficher que ces catégories (ex. celles présentes dans un lycée). */
  only?: CategoryId[];
  ariaLabel?: string;
}) {
  const list = only ? CATEGORIES.filter((c) => only.includes(c.id)) : CATEGORIES;
  return (
    <div className={`sl-chips${scroll ? " sl-chips-scroll" : ""}`} role="group" aria-label={ariaLabel}>
      <Chip label="Tous" selected={value.length === 0} onClick={() => onChange([])} />
      {list.map((c) => (
        <Chip
          key={c.id}
          label={c.label}
          emoji={c.emoji}
          count={counts?.[c.id]}
          selected={value.includes(c.id)}
          onClick={() => onChange(value.includes(c.id) ? value.filter((v) => v !== c.id) : [...value, c.id])}
        />
      ))}
    </div>
  );
}
