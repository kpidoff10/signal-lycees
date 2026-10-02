import { Icon } from "@/components/ui/Icon";
import "../prose.css";

interface Resource {
  id: string;
  name: string;
  /** Numéros affichés et composés (sans espaces pour le lien tel:). */
  numbers: { label: string; tel: string }[];
  description: string;
  when?: string;
  extra?: { text: string; href?: string; linkLabel?: string };
  urgent?: boolean;
}

export const HELP_RESOURCES: Resource[] = [
  {
    id: "urgence",
    name: "Urgence immédiate",
    numbers: [
      { label: "112", tel: "112" },
      { label: "17", tel: "17" },
    ],
    description:
      "Si toi ou quelqu’un d’autre est en danger tout de suite. Le 112 est le numéro d’urgence européen, le 17 appelle la police ou la gendarmerie.",
    when: "Gratuit, 24 h/24, 7 j/7",
    urgent: true,
  },
  {
    id: "3114",
    name: "3114 — Prévention du suicide",
    numbers: [{ label: "3114", tel: "3114" }],
    description:
      "Si tu as des idées suicidaires, si tu vas très mal, ou si tu t’inquiètes pour quelqu’un. Des professionnels du soin t’écoutent et t’aident.",
    when: "Gratuit, 24 h/24, 7 j/7",
    extra: { text: "Plus d’informations sur ", href: "https://3114.fr", linkLabel: "3114.fr" },
  },
  {
    id: "119",
    name: "119 — Enfance en danger",
    numbers: [{ label: "119", tel: "119" }],
    description:
      "Si tu subis des violences (à la maison, au lycée ou ailleurs), ou si tu penses qu’un autre jeune est en danger. L’appel n’apparaît pas sur les factures de téléphone.",
    when: "Gratuit, 24 h/24, 7 j/7",
    extra: { text: "Plus d’informations sur ", href: "https://www.allo119.gouv.fr", linkLabel: "allo119.gouv.fr" },
  },
  {
    id: "3018",
    name: "3018 — Harcèlement et cyberharcèlement",
    numbers: [{ label: "3018", tel: "3018" }],
    description:
      "Si tu es harcelé·e au lycée ou en ligne (messages, photos, rumeurs, comptes fake…), ou si tu en es témoin. On peut aussi t’aider à faire supprimer des contenus.",
    when: "Gratuit, 7 j/7 de 9 h à 23 h",
    extra: { text: "Aussi joignable par l’application 3018 et par tchat. Plus d’informations sur ", href: "https://e-enfance.org", linkLabel: "e-enfance.org" },
  },
  {
    id: "fsj",
    name: "Fil Santé Jeunes",
    numbers: [{ label: "0 800 235 236", tel: "0800235236" }],
    description:
      "Pour parler de ce qui te pèse : moral, stress, relations, corps, sexualité, consommations… Anonyme et sans jugement.",
    when: "Appel gratuit et anonyme",
    extra: { text: "Plus d’informations sur ", href: "https://www.filsantejeunes.com", linkLabel: "filsantejeunes.com" },
  },
];

/** Liste des numéros d'aide, réutilisable ailleurs dans le site. */
export function HelpResources({ compact = false, headingLevel = 3 }: { compact?: boolean; headingLevel?: 2 | 3 | 4 }) {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <ul className={compact ? "sl-help is-compact" : "sl-help"}>
      {HELP_RESOURCES.map((r) => (
        <li key={r.id}>
          <section className={r.urgent ? "sl-help-card is-urgent" : "sl-help-card"} aria-labelledby={`aide-${r.id}`}>
            <Heading id={`aide-${r.id}`} className="sl-help-name">
              {r.name}
            </Heading>
            <div className="sl-help-calls">
              {r.numbers.map((n) => (
                <a key={n.tel} href={`tel:${n.tel}`} className="sl-help-call" aria-label={`Appeler le ${n.label}`}>
                  <Icon name="phone" />
                  {n.label}
                </a>
              ))}
            </div>
            {r.when && <p className="sl-help-when">{r.when}</p>}
            {!compact && <p className="sl-help-desc">{r.description}</p>}
            {!compact && r.extra && (
              <p className="sl-help-extra">
                {r.extra.text}
                {r.extra.href && (
                  <a href={r.extra.href} target="_blank" rel="noopener noreferrer">
                    {r.extra.linkLabel}
                  </a>
                )}
                .
              </p>
            )}
          </section>
        </li>
      ))}
    </ul>
  );
}
