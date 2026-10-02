import { formatDay } from "@/lib/format";

export interface MobilizationView {
  happenedOn: string | Date;
  origin: "STUDENT" | "PRESS" | "ADMIN";
  reasons: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
}

/** Bandeau « Mobilisation en cours » : des faits sourcés, jamais d'heure ni de lieu de rendez-vous. */
export function MobilizationBanner({ m, compact }: { m: MobilizationView; compact?: boolean }) {
  const date = formatDay(new Date(m.happenedOn));
  return (
    <div className={`flex gap-3 rounded-[var(--radius-md)] border border-border bg-surface ${compact ? "p-3" : "p-4"}`}>
      <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-signal-soft text-lg">
        📣
      </span>
      <div className="min-w-0 text-[14px] leading-5">
        <p className="font-semibold">Mobilisation lycéenne signalée le {date}</p>
        {m.reasons && <p className="user-text mt-0.5 text-ink-muted">Motifs : {m.reasons}</p>}
        <p className="mt-0.5 text-[13px] text-ink-muted">
          {m.sourceName && m.sourceUrl ? (
            <>
              Source :{" "}
              <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="link">
                {m.sourceName}
              </a>
            </>
          ) : m.origin === "STUDENT" ? (
            "Signalée par un élève et vérifiée par la modération."
          ) : (
            "Ajoutée par la modération."
          )}{" "}
          · Affichage pendant quelques jours seulement.
        </p>
      </div>
    </div>
  );
}
