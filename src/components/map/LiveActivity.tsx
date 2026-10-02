"use client";

import { useQuery } from "@tanstack/react-query";
import { formatNumber, plural } from "@/lib/format";

interface Activity {
  newIssues: number;
  confirmationsLastHour: number;
  confirmationsToday: number;
  resolvedToday: number;
}

/** Activité du jour, rafraîchie toutes les minutes. Jamais de donnée personnelle. */
export function LiveActivity({ initial }: { initial: Activity }) {
  const { data } = useQuery({
    queryKey: ["activity"],
    initialData: initial,
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await fetch("/api/activity");
      if (!res.ok) throw new Error("activity");
      return (await res.json()) as Activity;
    },
  });
  const items = [
    { n: data.newIssues, text: plural(data.newIssues, "nouveau signalement aujourd’hui", "nouveaux signalements aujourd’hui") },
    { n: data.confirmationsLastHour, text: plural(data.confirmationsLastHour, "confirmation dans la dernière heure", "confirmations dans la dernière heure") },
    { n: data.resolvedToday, text: plural(data.resolvedToday, "problème indiqué comme résolu aujourd’hui", "problèmes indiqués comme résolus aujourd’hui") },
  ];
  const visible = items.filter((i) => i.n > 0);
  return (
    <div className="sl-live" aria-live="polite">
      <span className="sl-live-tag">
        <span className="sl-live-dot" aria-hidden="true" />
        En direct
      </span>
      {visible.length === 0 ? (
        <span className="sl-live-item">Calme plat pour l’instant aujourd’hui.</span>
      ) : (
        visible.map((i, k) => (
          <span key={i.text} className="contents">
            {k > 0 && <span className="sl-live-sep max-sm:hidden" aria-hidden="true" />}
            <span className={`sl-live-item${k > 0 ? " max-sm:hidden" : ""}`}>
              <b>{formatNumber(i.n)}</b> {i.text}
            </span>
          </span>
        ))
      )}
    </div>
  );
}
