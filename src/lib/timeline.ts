// Timeline d'un problème, générée uniquement depuis les données réelles.
import { formatNumber, plural } from "./format";

export interface TimelineInput {
  createdAt: Date;
  events: { type: string; data: unknown; createdAt: Date }[];
  daily: { day: Date; upTotal: number; resolvedTotal: number }[];
  /** Libellé du premier événement (ex. « Rapporté par franceinfo » pour un problème repris de la presse). */
  firstLabel?: string;
}

export interface TimelineEntry {
  date: Date;
  text: string;
  tone?: "signal" | "resolved";
}

const STATUS_TEXT: Record<string, { text: string; tone?: "signal" | "resolved" }> = {
  POSSIBLY_RESOLVED: { text: "Plusieurs élèves indiquent que le problème semble résolu", tone: "resolved" },
  RESOLVED: { text: "Problème résolu", tone: "resolved" },
  ACTIVE: { text: "Le problème est de nouveau signalé comme présent", tone: "signal" },
};

/**
 * Garde les jours où les confirmations ont nettement progressé (≥ 3 et ≥ 10 %),
 * les votes « résolu » et les changements de statut. Plus récent en dernier.
 */
export function buildTimeline(input: TimelineInput, max = 12): TimelineEntry[] {
  const entries: TimelineEntry[] = [{ date: input.createdAt, text: input.firstLabel ?? "Premier signalement" }];
  const days = [...input.daily].sort((a, b) => a.day.getTime() - b.day.getTime());
  let lastUp = input.firstLabel ? 0 : 1;
  let lastResolved = 0;
  for (const d of days) {
    const grew = d.upTotal - lastUp;
    if (grew >= 3 && grew >= lastUp * 0.1) {
      entries.push({ date: d.day, text: `${formatNumber(d.upTotal)} ${plural(d.upTotal, "confirmation")}` });
      lastUp = d.upTotal;
    }
    if (d.resolvedTotal > lastResolved) {
      entries.push({
        date: d.day,
        text: `${formatNumber(d.resolvedTotal)} ${plural(d.resolvedTotal, "personne indique", "personnes indiquent")} que le problème semble résolu`,
        tone: "resolved",
      });
      lastResolved = d.resolvedTotal;
    }
  }
  for (const e of input.events) {
    if (e.type === "STATUS_CHANGED") {
      const to = (e.data as { to?: string } | null)?.to;
      const s = to ? STATUS_TEXT[to] : undefined;
      if (s) entries.push({ date: e.createdAt, ...s });
    }
  }
  entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  return entries.length > max ? [entries[0]!, ...entries.slice(-(max - 1))] : entries;
}
