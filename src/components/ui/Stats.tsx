import { formatNumber } from "@/lib/format";

export interface StatItem {
  value: number | string;
  label: string;
  tone?: "signal" | "resolved" | "mobilization";
}

/** Compteurs : toujours un volume avec son unité, jamais une note. */
export function StatCounters({ items, compact }: { items: StatItem[]; compact?: boolean }) {
  return (
    <dl
      className={`sl-stats${compact ? " is-compact" : ""} max-md:!grid-cols-2`}
      style={compact ? undefined : { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((s) => (
        <div key={s.label} className={`sl-stat${s.tone ? ` sl-stat-${s.tone}` : ""}`}>
          <dd className="sl-stat-value max-md:!text-[30px] max-md:!leading-[34px]">
            {typeof s.value === "number" ? formatNumber(s.value) : s.value}
          </dd>
          <dt className="sl-stat-label">{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}
