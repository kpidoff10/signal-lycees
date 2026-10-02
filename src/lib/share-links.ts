// Liens de partage suivis. Chaque canal a un code court tiré au hasard (signal-lycees.fr/eqaqj) :
// le lien ne dit pas d'où il vient. Il redirige vers la page avec ?src=<code>, le compteur de
// visites (sans cookie) range l'arrivée sous le libellé du canal, puis le marqueur est retiré
// de la barre d'adresse. Liste fermée : une valeur inconnue est ignorée.
// Ne jamais changer un code une fois partagé : les anciens liens ne seraient plus comptés.

export interface ShareLink {
  /** Code court aléatoire, utilisé dans l'adresse et comme marqueur ?src=. */
  code: string;
  label: string;
  /** Où utiliser le lien. */
  hint: string;
  /** Page d'arrivée, l'accueil par défaut. */
  to?: string;
}

export const SHARE_LINKS: ShareLink[] = [
  { code: "eqaqj", label: "Lien · Instagram (bio)", hint: "Champ « Liens » du profil Instagram" },
  { code: "gksef", label: "Lien · Instagram (story)", hint: "Sticker « Lien » d’une story" },
  { code: "qptvj", label: "Lien · Instagram (message)", hint: "Messages privés Instagram" },
  { code: "fshyx", label: "Lien · Snapchat", hint: "Story ou message Snapchat" },
  { code: "q2qkc", label: "Lien · TikTok", hint: "Bio ou commentaire TikTok" },
  { code: "unxs8", label: "Lien · WhatsApp", hint: "Groupes et messages WhatsApp" },
  { code: "ejeks", label: "Lien · Discord", hint: "Serveurs Discord" },
  { code: "tqxwq", label: "Lien · X (Twitter)", hint: "Publications X" },
  { code: "mfmw9", label: "Lien · Facebook", hint: "Publications et groupes Facebook" },
  { code: "z32vc", label: "Lien · Reddit", hint: "Publications Reddit" },
  { code: "k5zf4", label: "Lien · Mail presse", hint: "Mails aux journalistes (arrive sur l’espace presse)", to: "/presse" },
  { code: "hm9s5", label: "Lien · Mail syndicats et associations", hint: "Mails aux syndicats, associations, CVL" },
  { code: "vkguu", label: "Lien · SMS", hint: "Textos" },
];

/** Marqueur du QR code des affiches (ajouté automatiquement, pas de lien court). */
export const POSTER_CODE = "rh38a";
export const POSTER_LABEL = "Affiche (QR code)";

export const CAMPAIGN_LABELS: Record<string, string> = {
  ...Object.fromEntries(SHARE_LINKS.map((l) => [l.code, l.label])),
  [POSTER_CODE]: POSTER_LABEL,
  // Premières affiches imprimées avec l'ancien marqueur lisible.
  affiche: POSTER_LABEL,
};
