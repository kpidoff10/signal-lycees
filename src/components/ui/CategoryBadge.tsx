import { category, type CategoryId } from "@/lib/categories";

export function CategoryBadge({ id }: { id: CategoryId }) {
  const c = category(id);
  return (
    <span className="cat-badge">
      <span aria-hidden="true">{c.emoji}</span>
      {c.label}
    </span>
  );
}

export function ResolvedBadge({ label = "Résolu" }: { label?: string }) {
  return (
    <span className="resolved-badge">
      <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
      {label}
    </span>
  );
}
