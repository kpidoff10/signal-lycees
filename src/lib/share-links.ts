// Liens de partage suivis : ?src=<clé> sur l'URL d'arrivée. Le compteur de visites
// (sans cookie) range alors l'arrivée sous ce libellé au lieu du site d'origine.
// Liste fermée : une valeur inconnue est ignorée, les statistiques restent propres.

export interface ShareLink {
  key: string;
  label: string;
  /** Où utiliser le lien. */
  hint: string;
}

export const SHARE_LINKS: ShareLink[] = [
  { key: "insta-bio", label: "Lien · Instagram (bio)", hint: "Champ « Liens » du profil Instagram" },
  { key: "insta-story", label: "Lien · Instagram (story)", hint: "Sticker « Lien » d’une story" },
  { key: "insta-dm", label: "Lien · Instagram (message)", hint: "Messages privés Instagram" },
  { key: "snap", label: "Lien · Snapchat", hint: "Story ou message Snapchat" },
  { key: "tiktok", label: "Lien · TikTok", hint: "Bio ou commentaire TikTok" },
  { key: "whatsapp", label: "Lien · WhatsApp", hint: "Groupes et messages WhatsApp" },
  { key: "discord", label: "Lien · Discord", hint: "Serveurs Discord" },
  { key: "x", label: "Lien · X (Twitter)", hint: "Publications X" },
  { key: "facebook", label: "Lien · Facebook", hint: "Publications et groupes Facebook" },
  { key: "reddit", label: "Lien · Reddit", hint: "Publications Reddit" },
  { key: "mail-presse", label: "Lien · Mail presse", hint: "Mails aux journalistes" },
  { key: "mail-asso", label: "Lien · Mail syndicats et associations", hint: "Mails aux syndicats, associations, CVL" },
  { key: "sms", label: "Lien · SMS", hint: "Textos" },
  { key: "affiche", label: "Affiche (QR code)", hint: "Ajouté automatiquement aux QR codes des affiches" },
];

export const CAMPAIGN_LABELS: Record<string, string> = Object.fromEntries(SHARE_LINKS.map((l) => [l.key, l.label]));
