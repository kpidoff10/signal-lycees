import Link from "next/link";
import { plural } from "@/lib/format";
import { shortSchoolName } from "@/lib/school-name";
import type { DirSchool, SchoolActivity } from "@/server/places";

const card = "flex min-w-0 items-center gap-3 rounded-[14px] border border-border bg-surface px-4 py-3 hover:border-border-strong";

export function ActivityChips({ issues, mobs, mobLabel }: { issues: number; mobs: number; mobLabel?: string }) {
  if (!issues && !mobs) return null;
  return (
    <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
      {mobs > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[12px] font-bold">
          📣 {mobLabel ?? "Mobilisation"}
        </span>
      )}
      {issues > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-signal-soft px-2 py-0.5 text-[12px] font-bold text-signal-ink">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-signal" />
          {issues} {plural(issues, "problème")}
        </span>
      )}
    </span>
  );
}

/** Lycées d'une ville ou d'un département : mobilisés d'abord, puis par nombre de problèmes. */
export function SchoolList({ schools, activity, showCity = false }: { schools: DirSchool[]; activity: Map<string, SchoolActivity>; showCity?: boolean }) {
  const sorted = [...schools].sort((a, b) => {
    const x = activity.get(a.id);
    const y = activity.get(b.id);
    return Number(!!y?.mob) - Number(!!x?.mob) || (y?.issues ?? 0) - (x?.issues ?? 0);
  });
  return (
    <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
      {sorted.map((s) => {
        const a = activity.get(s.id);
        return (
          <li key={s.id}>
            <Link href={`/lycee/${s.slug}`} className={card}>
              <span className="min-w-0 flex-1">
                <span className="block font-bold leading-snug">{shortSchoolName(s.name)}</span>
                <span className="block text-[13px] leading-5 text-ink-muted">
                  {s.type}
                  {s.sector ? ` · ${s.sector.toLowerCase()}` : ""}
                  {showCity ? ` · ${s.cityLabel}` : ""}
                </span>
              </span>
              <ActivityChips issues={a?.issues ?? 0} mobs={a?.mob ? 1 : 0} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function PlaceLinkGrid({
  items,
}: {
  items: { href: string; label: string; sub: string; issues: number; mobs: number; mobLabel?: string }[];
}) {
  return (
    <ul className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <li key={i.href} className="min-w-0">
          <Link href={i.href} className={card}>
            <span className="min-w-0 flex-1">
              <span className="block font-bold leading-snug">{i.label}</span>
              <span className="block text-[13px] leading-5 text-ink-muted">{i.sub}</span>
            </span>
            <ActivityChips issues={i.issues} mobs={i.mobs} mobLabel={i.mobLabel ?? String(i.mobs)} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
