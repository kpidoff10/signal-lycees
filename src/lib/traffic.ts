// Règles de comptage de la fréquentation (fonctions pures, testées).

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

/** Jour (AAAA-MM-JJ) à l'heure de Paris : les statistiques suivent la journée française. */
export function parisDay(d = new Date()): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
