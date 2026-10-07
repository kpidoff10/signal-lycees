// Revue de presse : lecture des flux RSS et règles de décision (fonctions pures, testées).
import { z } from "zod";

export interface FeedItem {
  title: string;
  url: string;
  source: string;
  publishedAt: Date;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n: string) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const tag = (block: string, name: string) => block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"))?.[1];

/**
 * Éléments d'un flux RSS 2.0. `defaultSource` sert quand l'élément n'indique pas sa source.
 * Google Actualités met la source dans <source> et la répète en fin de titre (« Titre - Source ») : on la retire.
 */
export function parseRss(xml: string, defaultSource: string): FeedItem[] {
  const items: FeedItem[] = [];
  for (const m of xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)) {
    const block = m[0];
    const rawTitle = decodeXml(tag(block, "title") ?? "");
    const url = unwrapRedirect(decodeXml(tag(block, "link") ?? ""));
    const date = new Date(decodeXml(tag(block, "pubDate") ?? ""));
    const source = decodeXml(tag(block, "source") ?? "") || defaultSource;
    if (!rawTitle || !/^https?:\/\//.test(url) || Number.isNaN(date.getTime())) continue;
    const suffix = ` - ${source}`;
    const title = rawTitle.endsWith(suffix) ? rawTitle.slice(0, -suffix.length).trim() : rawTitle;
    items.push({ title: title.slice(0, 300), url: url.slice(0, 1000), source: source.slice(0, 120), publishedAt: date });
  }
  return items;
}

/** Bing Actualités renvoie vers son propre traceur (…/apiclick.aspx?url=<article>) : on garde l'adresse de l'article. */
export function unwrapRedirect(url: string): string {
  try {
    const u = new URL(url);
    const target = u.hostname.endsWith("bing.com") ? u.searchParams.get("url") : null;
    return target && /^https?:\/\//.test(target) ? target : url;
  } catch {
    return url;
  }
}

/** Texte comparable : minuscules, sans accents, ponctuation réduite à des espaces. */
export function fold(s: string): string {
  return ` ${s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
}

function foldCased(s: string): string {
  return ` ${s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, " ").trim()} `;
}

/**
 * Titre qui annonce une liste d'établissements fermés ou bloqués (« Quels lycées sont fermés lundi ? »,
 * « 27 établissements fermés », « Voici les lycées bloqués ») : l'article est alors lu pour en tirer la liste.
 */
export function announcesSchoolList(title: string): boolean {
  const t = fold(title);
  const shut = /\s(fermes?|fermees?|fermeture|bloques?|bloquees?|distance|distanciel)\s/.test(t);
  const many = /\s(quels?|quelles?|liste|voici|\d+|dizaine|six|sept|huit|neuf|dix|onze|douze|plusieurs)\s(\S+\s){0,4}(lycees|etablissements)\s/.test(t);
  return shut && many;
}

const listSchema = z.object({
  url: z.string().url(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  schools: z.array(z.object({ name: z.string().min(2).max(120), city: z.string().min(2).max(80) })).max(200),
});
export type SchoolList = z.infer<typeof listSchema>;

/**
 * Lit la réponse JSON du modèle (blocs de code tolérés). Prudence : l'URL doit faire partie des sources
 * citées, et la date de fermeture tomber entre la veille de la parution et quatre jours après.
 */
export function parseSchoolList(text: string, citedUrls: string[], publishedAt: Date): SchoolList | null {
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  let parsed: SchoolList;
  try {
    parsed = listSchema.parse(JSON.parse(json));
  } catch {
    return null;
  }
  if (!citedUrls.includes(parsed.url)) return null;
  const day = Date.parse(`${parsed.date}T12:00:00Z`);
  const from = publishedAt.getTime() - 36 * 3600_000;
  if (!(day >= from && day <= publishedAt.getTime() + 4 * 86400_000)) return null;
  return parsed;
}

/** Premier tri, sans IA : le titre doit parler de lycée(s) ou de lycéens. */
export function mentionsHighSchool(title: string): boolean {
  return /\s(lycee|lycees|lyceen|lyceenne|lyceens|lyceennes)\s/.test(fold(title));
}

/** Le titre évoque une mobilisation (blocus, fermeture, rassemblement, grève…) : jugé en priorité. */
export function mentionsMobilization(title: string): boolean {
  return /\s(blocus|bloque|bloques|bloquee|bloquees|bloquent|bloquer|barricades?|poubelles|mobilisation|mobilises?|mobilisees?|rassemblement|greve|manifestation|manifestent|fermes?|fermees?|fermeture|distanciel)\s/.test(
    fold(title),
  );
}

/** Ordre de passage devant Jev : les titres de mobilisation d'abord, puis les plus récents. */
export function byPressPriority(a: { title: string; publishedAt: Date }, b: { title: string; publishedAt: Date }): number {
  const ma = mentionsMobilization(a.title) ? 1 : 0;
  const mb = mentionsMobilization(b.title) ? 1 : 0;
  return mb - ma || b.publishedAt.getTime() - a.publishedAt.getTime();
}

export interface PressScores {
  relevance: number; // parle de lycées en France
  sensitive: number; // fait divers grave, mise en cause de personnes
  offTopic: number; // publicité, contenu sponsorisé, sans rapport
  mobilization?: number; // rapporte un blocus, une fermeture ou une mobilisation dans un lycée précis
}

export type PressDecision = { status: "PUBLISHED" | "PENDING" | "REJECTED"; reason: string };

/**
 * Mobilisation tirée d'un titre rattaché à un ou deux lycées précis. Jev sûr et article publié : publiée.
 * Jev hésite ou penche pour non (0,2 à 0,85) : second avis. Jev sûr que non : rien, sans bruit.
 */
export function decidePressMobilization(probability: number | undefined, articleStatus: PressDecision["status"]): "PUBLISHED" | "CHECK" | null {
  if (probability == null || articleStatus === "REJECTED" || probability < 0.2) return null;
  return probability >= 0.85 && articleStatus === "PUBLISHED" ? "PUBLISHED" : "CHECK";
}

/** Second avis (GPT) sur un titre où Jev n'a pas tranché la mobilisation. */
export interface MobilizationOpinion {
  blockade: boolean; // le titre rapporte un blocus, une fermeture ou une mobilisation dans ce lycée
  verdict: "publish" | "reject" | "unsure";
  reason: string;
}

export type MobilizationOutcome = { action: "PUBLISHED" | "PENDING" | "REFUSED"; reason: string };

/**
 * Publiée si le second avis confirme (et que l'article est publié), refusée s'il infirme, à valider sinon.
 * Second avis désactivé ou indisponible : à valider seulement si Jev penchait pour oui (comme avant).
 */
export function decideMobilizationWithSecondOpinion(
  jev: number,
  gpt: MobilizationOpinion | null,
  articleStatus: PressDecision["status"],
): MobilizationOutcome | null {
  if (!gpt) return jev >= 0.5 ? { action: "PENDING", reason: "Second avis indisponible" } : null;
  const why = gpt.reason.slice(0, 200);
  if (gpt.verdict === "publish" && gpt.blockade)
    return articleStatus === "PUBLISHED" ? { action: "PUBLISHED", reason: why } : { action: "PENDING", reason: `Confirmée, mais article en vérification : ${why}` };
  if (gpt.verdict === "reject" || !gpt.blockade) return { action: "REFUSED", reason: why };
  return { action: "PENDING", reason: why };
}

/** Publié seulement si Jev est sûr ; refusé seulement s'il est sûr du contraire ; sinon la modération tranche. */
export function decidePress(s: PressScores | null): PressDecision {
  if (!s) return { status: "PENDING", reason: "Jev indisponible" };
  if (s.offTopic >= 0.8) return { status: "REJECTED", reason: "Hors sujet ou publicitaire" };
  if (s.relevance <= 0.2) return { status: "REJECTED", reason: "Ne parle pas des lycées" };
  if (s.sensitive >= 0.35) return { status: "PENDING", reason: "Sujet sensible : à vérifier" };
  if (s.relevance >= 0.8 && s.offTopic <= 0.2) return { status: "PUBLISHED", reason: "Publié automatiquement" };
  return { status: "PENDING", reason: "Doute de Jev" };
}

/** Second avis (GPT) sur un article que Jev a mis en vérification. */
export interface SecondOpinion {
  aboutHighSchools: boolean; // parle bien de la vie des lycées en France
  identifiesPerson: boolean; // nomme ou rend reconnaissable un élève, un adulte de l'établissement, une victime
  sensational: boolean; // titre racoleur, choquant, qui fait d'un fait divers un spectacle
  factual: boolean; // information rapportée par un média, pas une opinion ni une rumeur
  verdict: "publish" | "reject" | "unsure";
  reason: string;
}

/**
 * Double vérification (règle éditoriale A) : un article factuel sur les lycées, même sur des incidents,
 * est publié si personne n'est reconnaissable et que le titre n'est pas racoleur. Sinon il est écarté
 * sans passer par la modération : la revue n'a pas besoin d'être exhaustive.
 * Le second avis ne publie que ce que Jev a déjà jugé pertinent.
 */
export function decideWithSecondOpinion(jev: PressScores, gpt: SecondOpinion | null): PressDecision {
  if (!gpt) return { status: "PENDING", reason: "Second avis indisponible" };
  const why = gpt.reason.slice(0, 160);
  const clean = gpt.aboutHighSchools && gpt.factual && !gpt.identifiesPerson && !gpt.sensational;
  if (clean && gpt.verdict === "publish" && jev.relevance >= 0.6 && jev.offTopic < 0.5)
    return { status: "PUBLISHED", reason: `Publié après double vérification : ${why}` };
  return { status: "REJECTED", reason: `Écarté après double vérification : ${why}` };
}

export interface CityRef {
  slug: string;
  name: string;
  schools: { id: string; name: string }[];
}

const GENERIC = new Set([
  "lycee", "general", "generale", "technologique", "professionnel", "professionnelle", "polyvalent", "prive", "privee", "public",
  "section", "enseignement", "ecole", "secondaire", "site", "metiers", "agricole", "des", "les", "de", "du", "la", "le", "et", "d", "l",
]);

/** Mots propres du nom d'un lycée, majuscules conservées (« Lycée Fréderic et Irène Joliot-Curie » → Frederic Irene Joliot Curie). */
function properWords(name: string, cityWords: Set<string>): string[] {
  return foldCased(name)
    .trim()
    .split(" ")
    .filter((w) => w.length > 1 && !GENERIC.has(w.toLowerCase()) && !cityWords.has(w.toLowerCase()));
}

const isCapitalized = (k: string) => /^[A-Z]/.test(k);

/**
 * Rattache un titre à une commune puis, si possible, à un lycée de cette commune.
 * Prudent : la commune doit apparaître avec sa majuscule ; le lycée par son nom complet, sinon par
 * son nom de famille (« lycée Joliot-Curie »), lui aussi avec majuscule. Plus de deux lycées possibles : on ne devine pas.
 */
export function matchPlaces(title: string, cities: CityRef[]): { citySlug: string | null; schoolIds: string[] } {
  const t = fold(title);
  // La commune doit garder sa majuscule dans le titre : « les tours du lycée » ne désigne pas Tours.
  const cased = foldCased(title);
  const found = cities
    .filter((c) => c.name.length >= 4 && cased.includes(foldCased(c.name)))
    .sort((a, b) => b.name.length - a.name.length);
  const city = found[0];
  // Commune homonyme (Saint-Denis 93 et 974) : on ne devine pas.
  if (!city || found.some((c) => c !== city && c.name === city.name)) return { citySlug: null, schoolIds: [] };
  const full: string[] = [];
  const bySurname: string[] = [];
  // « Lycée professionnel de coiffure de Lyon » ne doit pas répondre à « Lyon ».
  const cityWords = new Set(fold(city.name).trim().split(" "));
  for (const s of city.schools) {
    const words = properWords(s.name, cityWords);
    const core = words.join(" ");
    if (core.length >= 4 && t.includes(` ${core.toLowerCase()} `)) full.push(s.id);
    else {
      const keys = [words.slice(-2).join(" "), words.at(-1) ?? ""].filter((k) => k.length >= 4 && isCapitalized(k));
      if (keys.some((k) => cased.includes(` ${k} `))) bySurname.push(s.id);
    }
  }
  const schoolIds = full.length ? full : bySurname;
  return { citySlug: city.slug, schoolIds: schoolIds.length <= 2 ? schoolIds : [] };
}
