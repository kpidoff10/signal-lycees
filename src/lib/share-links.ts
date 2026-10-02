// Liens de partage suivis. On partage une adresse courte et lisible (signal-lycees.fr/insta)
// qui redirige vers la page avec ?src=<clé> ; le compteur de visites (sans cookie) range
// l'arrivée sous ce libellé, puis le marqueur est retiré de la barre d'adresse.
// Liste fermée : une valeur inconnue est ignorée, les statistiques restent propres.

export interface ShareLink {
  key: string;
  label: string;
  /** Où utiliser le lien. */
  hint: string;
  /** Adresse courte à partager (sans lien court pour les affiches : le QR code porte ?src=). */
  path?: string;
  /** Page d'arrivée, l'accueil par défaut. */
  to?: string;
}

export const SHARE_LINKS: ShareLink[] = [
  { key: "insta-bio", path: "/insta", label: "Lien · Instagram (bio)", hint: "Champ « Liens » du profil Instagram" },
  { key: "insta-story", path: "/story", label: "Lien · Instagram (story)", hint: "Sticker « Lien » d’une story" },
  { key: "insta-dm", path: "/dm", label: "Lien · Instagram (message)", hint: "Messages privés Instagram" },
  { key: "snap", path: "/snap", label: "Lien · Snapchat", hint: "Story ou message Snapchat" },
  { key: "tiktok", path: "/tiktok", label: "Lien · TikTok", hint: "Bio ou commentaire TikTok" },
  { key: "whatsapp", path: "/whatsapp", label: "Lien · WhatsApp", hint: "Groupes et messages WhatsApp" },
  { key: "discord", path: "/discord", label: "Lien · Discord", hint: "Serveurs Discord" },
  { key: "x", path: "/x", label: "Lien · X (Twitter)", hint: "Publications X" },
  { key: "facebook", path: "/fb", label: "Lien · Facebook", hint: "Publications et groupes Facebook" },
  { key: "reddit", path: "/reddit", label: "Lien · Reddit", hint: "Publications Reddit" },
  { key: "mail-presse", path: "/media", to: "/presse", label: "Lien · Mail presse", hint: "Mails aux journalistes (arrive sur l’espace presse)" },
  { key: "mail-asso", path: "/asso", label: "Lien · Mail syndicats et associations", hint: "Mails aux syndicats, associations, CVL" },
  { key: "sms", path: "/sms", label: "Lien · SMS", hint: "Textos" },
  { key: "affiche", label: "Affiche (QR code)", hint: "Ajouté automatiquement aux QR codes des affiches" },
];

export const CAMPAIGN_LABELS: Record<string, string> = Object.fromEntries(SHARE_LINKS.map((l) => [l.key, l.label]));
