// Couche 1 de la modération : règles déterministes, sans IA.
// Elles ne publient jamais rien seules : elles bloquent la publication
// automatique (hard) ou rendent l'analyse IA plus exigeante (soft).

export type RuleCode =
  | "EMAIL"
  | "PHONE"
  | "URL"
  | "HANDLE"
  | "NAMED_PERSON"
  | "ROLE_TARGETED"
  | "INSULT"
  | "THREAT"
  | "SELF_HARM"
  | "SEXUAL"
  | "INJECTION";

export type RuleLevel = "soft" | "hard" | "urgent";

export interface RuleHit {
  code: RuleCode;
  level: RuleLevel;
  match: string;
}

/** Texte comparable : minuscules, sans accents, leetspeak et lettres espacées repliés. */
export function canonical(input: string): string {
  let s = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  // Homoglyphes courants (cyrillique, grec) vers le latin.
  const homoglyphs: Record<string, string> = {
    а: "a", е: "e", о: "o", р: "p", с: "c", у: "y", х: "x", і: "i", ј: "j", ѕ: "s", ԁ: "d", ɡ: "g",
    α: "a", ο: "o", ρ: "p", ν: "v", κ: "k", τ: "t", ι: "i",
  };
  s = s.replace(/[^\x00-\x7f]/g, (ch) => homoglyphs[ch] ?? ch);
  const leet: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s", "€": "e" };
  // Leetspeak uniquement à l'intérieur des mots (on garde les vrais nombres : « 3 semaines »).
  s = s.replace(/[a-z][0-9@$€]+[a-z]*|[0-9@$€]+[a-z]+/g, (w) => w.replace(/[0-9@$€]/g, (c) => leet[c] ?? c));
  // « c o n n a r d », « c.o.n.n.a.r.d », « c-o-n » → « connard »
  s = s.replace(/\b(?:[a-z][\s.\-_*]){2,}[a-z]\b/g, (w) => w.replace(/[\s.\-_*]/g, ""));
  // Lettres répétées : « connnnard » → « connard » (garde les doubles).
  s = s.replace(/([a-z])\1{2,}/g, "$1$1");
  return s.replace(/\s+/g, " ").trim();
}

const EMAIL = /[\w.+-]+\s*(?:@|\(at\)|\[at\])\s*[\w-]+\s*(?:\.|\(dot\))\s*[a-z]{2,}/i;
const PHONE = /(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/;
const URL_RE = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|fr|net|org|io|gg|me|tv|be|ly)\b(?:\/\S*)?/i;
const HANDLE = /(?:^|\s)@[a-z0-9_.]{3,}|\b(?:insta|instagram|snap|snapchat|tiktok|discord)\s*[:@]?\s*[a-z0-9_.]{3,}/i;

// Civilité suivie d'un mot : « M. Dupont », « mme durand », « monsieur X ».
const CIVILITY = /(?:^|[^a-z])(?:m\.|mr\.?|mme|mlle|madame|monsieur|mademoiselle|prof\.?)\s+(?!de\b|des\b|du\b|d'|la\b|le\b|les\b)[a-z][a-z'-]{1,}/;
// Initiale de nom : « Mr D. », « M. D »
const INITIAL = /(?:^|[^a-z])(?:m\.|mr\.?|mme|mlle|madame|monsieur)\s+[a-z]\.?(?:\s|$)/;
// Prénom + nom en capitales dans le texte d'origine : « Kevin DURAND »
const FULL_NAME_CAPS = /\b[A-ZÉÈ][a-zéèêëàâîïôöûüç]+\s+[A-ZÉÈ]{2,}\b/;

const ROLES = [
  "prof", "professeur", "professeure", "enseignant", "enseignante", "cpe", "proviseur", "proviseure",
  "proviseur adjoint", "proviseure adjointe", "principal", "principale", "directeur", "directrice",
  "surveillant", "surveillante", "pion", "pionne", "aed", "infirmier", "infirmiere", "documentaliste",
  "intendant", "intendante", "gestionnaire", "secretaire", "conseiller", "conseillere", "agent",
  "cuisinier", "cuisiniere", "chef de cuisine", "dame de la cantine", "concierge", "gardien", "gardienne",
  "eleve", "delegue", "deleguee",
];
const ROLE_RE = new RegExp(`\\b(?:le|la|l'|notre|ce|cette|cet|mon|ma|son|sa)\\s*(?:${ROLES.join("|")})s?\\b`);

// Insultes et injures (liste volontairement courte et non exhaustive : Jev complète).
const INSULTS = [
  "connard", "connasse", "conne", "con", "cons", "salope", "salaud", "pute", "putain de prof", "encule", "enculee",
  "batard", "batarde", "fdp", "ntm", "nique ta", "niquer", "abruti", "abrutie", "debile", "cretin", "cretine",
  "imbecile", "tocard", "tocarde", "boloss", "bouffon", "bouffonne", "pd", "pede", "tapette", "gouine",
  "negro", "negre", "bougnoule", "youpin", "bicot", "raton", "chinetoque", "mongol", "attarde", "attardee",
  "grosse vache", "gros porc", "sale race", "ta mere", "va te faire",
];
const INSULT_RE = new RegExp(`\\b(?:${INSULTS.map((w) => w.replace(/ /g, "\\s+")).join("|")})s?\\b`);

const THREAT_RE =
  /\b(?:je vais|on va|il faut|faudrait)\s+(?:le|la|les|vous|te|lui|leur)?\s*(?:tuer|buter|frapper|defoncer|planter|egorger|bruler|tabasser|cramer)|\b(?:bombe|explosif|attentat|fusillade|flingue|pistolet|kalach|kalachnikov|arme a feu)\b|\b(?:tuer|buter|egorger)\b/;

const SELF_HARM_RE =
  /\b(?:me suicider|suicide|me tuer|en finir|envie de mourir|veux mourir|plus envie de vivre|me faire du mal|me scarifier|scarification|me mutiler|me jeter)\b/;

const SEXUAL_RE =
  /\b(?:nude|nudes|nue sur|photos? (?:de moi |d'elle |de lui )?nue?s?|attouchements?|agression sexuelle|viol|violee|viole|harcelement sexuel|sexto|porno|pedo|pedophile)\b/;

const INJECTION_RE =
  /\b(?:ignore|oublie|ignorez|oubliez)\s+(?:les|tes|vos|toutes les|vos)?\s*(?:instructions|consignes|regles)|system prompt|prompt systeme|tu es maintenant|reponds? (?:publishable|true|oui)/;

export function runRules(title: string, description: string): RuleHit[] {
  const raw = `${title}\n${description}`;
  const text = canonical(raw);
  const hits: RuleHit[] = [];
  const test = (re: RegExp, code: RuleCode, level: RuleLevel, source = text) => {
    const m = source.match(re);
    if (m) hits.push({ code, level, match: m[0].trim().slice(0, 60) });
  };

  test(EMAIL, "EMAIL", "hard", raw);
  test(PHONE, "PHONE", "hard", raw);
  test(URL_RE, "URL", "hard", raw);
  test(HANDLE, "HANDLE", "hard", raw);
  test(CIVILITY, "NAMED_PERSON", "hard");
  if (!hits.some((h) => h.code === "NAMED_PERSON")) test(INITIAL, "NAMED_PERSON", "hard");
  if (!hits.some((h) => h.code === "NAMED_PERSON")) test(FULL_NAME_CAPS, "NAMED_PERSON", "hard", raw);
  test(ROLE_RE, "ROLE_TARGETED", "soft");
  test(INSULT_RE, "INSULT", "hard");
  test(THREAT_RE, "THREAT", "urgent");
  test(SELF_HARM_RE, "SELF_HARM", "urgent");
  test(SEXUAL_RE, "SEXUAL", "urgent");
  test(INJECTION_RE, "INJECTION", "hard");
  return hits;
}
