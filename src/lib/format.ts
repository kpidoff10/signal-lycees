// Formats français : espace fine insécable pour les milliers, unités toujours présentes.
const nf = new Intl.NumberFormat("fr-FR");

export function formatNumber(n: number): string {
  // Intl utilise U+202F (espace fine insécable) en fr-FR.
  return nf.format(n);
}

export function plural(n: number, singular: string, pluralForm?: string): string {
  return n <= 1 ? singular : (pluralForm ?? `${singular}s`);
}

/** « 12 problèmes actifs », « 1 confirmation ». */
export function countLabel(n: number, singular: string, pluralForm?: string): string {
  return `${formatNumber(n)} ${plural(n, singular, pluralForm)}`;
}

const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

/** « il y a 3 jours », « il y a 2 mois ». */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const s = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return "à l’instant";
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (abs < 86400 * 7) return rtf.format(Math.round(s / 86400), "day");
  if (abs < 86400 * 30) return rtf.format(Math.round(s / (86400 * 7)), "week");
  if (abs < 86400 * 365) return rtf.format(Math.round(s / (86400 * 30)), "month");
  return rtf.format(Math.round(s / (86400 * 365)), "year");
}

const df = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });
const dfy = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export function formatDay(date: Date, now: Date = new Date()): string {
  const s = date.getFullYear() === now.getFullYear() ? df.format(date) : dfy.format(date);
  // « 1er octobre » plutôt que « 1 octobre ».
  return s.replace(/^1 /, "1er ");
}

/** Guillemets français avec espaces insécables. */
export function quote(text: string): string {
  return `« ${text} »`;
}
