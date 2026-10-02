import { formatDay } from "@/lib/format";

/** Problème repris d'un article de presse : toujours signalé comme tel, avec sa source. */
export function PressBadge({ source, withLink = true }: { source: { name: string; url: string; date: string | Date | null }; withLink?: boolean }) {
  const date = source.date ? formatDay(new Date(source.date)) : null;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 text-[13px]">
      <span className="rounded-full border border-border-strong px-2 py-0.5 text-[12px] font-bold text-ink">Repris de la presse</span>
      {withLink ? (
        <a href={source.url} target="_blank" rel="noopener noreferrer nofollow" className="link text-[13px]">
          {source.name}
          {date ? `, ${date}` : ""}
        </a>
      ) : (
        <span className="text-ink-muted">
          {source.name}
          {date ? `, ${date}` : ""}
        </span>
      )}
    </span>
  );
}
