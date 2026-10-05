// Règles de comptage de la fréquentation (fonctions pures, testées).
import { CAMPAIGN_LABELS } from "./share-links";

const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link|whatsapp|telegrambot|discordbot|preview|headless|lighthouse|pagespeed|curl|wget|python|axios|node-fetch|go-http|monitor|uptime/i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT.test(userAgent);
}

/** Chemin public à compter, ou null (admin, API, fichiers, chemins farfelus). */
export function countablePath(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.length > 160) return null;
  const path = raw.split(/[?#]/)[0]!.replace(/\/+$/, "") || "/";
  if (/^\/(admin|api|_next|suivi)(\/|$)/.test(path)) return null; // jamais les liens de suivi (jetons secrets)
  if (!/^[a-z0-9\-/]*$/i.test(path)) return null;
  return path;
}

const SOURCES: [RegExp, string][] = [
  [/snapchat/, "Snapchat"],
  [/instagram/, "Instagram"],
  [/tiktok/, "TikTok"],
  [/(^|\.)t\.co$|twitter|x\.com/, "X (Twitter)"],
  [/facebook|fb\.com|messenger/, "Facebook"],
  [/whatsapp/, "WhatsApp"],
  [/discord/, "Discord"],
  [/reddit/, "Reddit"],
  [/google\./, "Google"],
  [/bing\./, "Bing"],
  [/duckduckgo/, "DuckDuckGo"],
  [/qwant/, "Qwant"],
  [/ecosia/, "Ecosia"],
  [/linkedin|lnkd\.in/, "LinkedIn"],
];

/** Provenance lisible à partir du référent (domaine seulement, jamais l'URL complète). */
export function sourceFromReferrer(referrer: unknown, ownHost: string): string {
  if (typeof referrer !== "string" || !referrer) return "Direct";
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "Direct";
  }
  if (!host || host === ownHost.replace(/^www\./, "")) return "Direct";
  for (const [re, name] of SOURCES) if (re.test(host)) return name;
  return host.slice(0, 60);
}

/** Provenance indiquée par le marqueur ?src= de nos liens de partage (prioritaire sur le référent), ou null. */
export function sourceFromCampaign(src: unknown): string | null {
  return typeof src === "string" && Object.hasOwn(CAMPAIGN_LABELS, src) ? CAMPAIGN_LABELS[src]! : null;
}

/** Code ?src= d'un contact démarché : 6 caractères a-z et 2-9, hors codes des liens de partage. */
export function isOutreachCode(src: string): boolean {
  return /^[a-z2-9]{6}$/.test(src) && !Object.hasOwn(CAMPAIGN_LABELS, src);
}

/** Code aléatoire pour un contact (sans 0, 1, o, l : lisible si on le recopie). */
export function newOutreachCode(random: () => number = Math.random): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(random() * alphabet.length)]).join("");
}

/** Jour (AAAA-MM-JJ) à l'heure de Paris : les statistiques suivent la journée française. */
export function parisDay(d = new Date()): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
