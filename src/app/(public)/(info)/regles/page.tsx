import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { InfoHeader } from "../_components/InfoHeader";

export const metadata: Metadata = {
  title: "Règles de publication",
  description:
    "Décris une situation, jamais une personne : les règles pour publier un signalement sur Signal Lycées, avec des exemples de ce qui est accepté ou refusé.",
};

function Example({ ok, text, note }: { ok: boolean; text: string; note?: string }) {
  return (
    <div className={ok ? "sl-example is-ok" : "sl-example is-ko"}>
      <p className="sl-example-tag">
        <Icon name={ok ? "check" : "close"} size={14} />
        {ok ? "Accepté" : "Refusé"}
      </p>
      <p className="sl-example-text">« {text} »</p>
      {note && <p className="sl-example-note">{note}</p>}
    </div>
  );
}

export default function ReglesPage() {
  return (
    <>
      <InfoHeader
        eyebrow="Avant de publier"
        title="Règles de publication"
        lead="Une seule règle à retenir : tu décris une situation, jamais une personne. Le but est que le problème soit réglé, pas que quelqu’un soit montré du doigt."
      />

      <div className="sl-prose">
        <h2>Décrire une situation</h2>
        <p>Un bon signalement dit :</p>
        <ul>
          <li>
            <strong>quoi</strong> : ce qui ne fonctionne pas ou ce qui manque ;
          </li>
          <li>
            <strong>où</strong> : le bâtiment, l’étage, le type de salle, le niveau concerné ;
          </li>
          <li>
            <strong>depuis quand</strong> et <strong>à quelle fréquence</strong> ;
          </li>
          <li>
            <strong>les conséquences</strong> pour les élèves.
          </li>
        </ul>
        <p>Reste factuel et précis. Pas besoin d’en rajouter : les confirmations des autres élèves montreront l’ampleur du problème.</p>

        <h2>Ce qui est interdit</h2>
        <ul>
          <li>
            <strong>Nommer ou désigner une personne</strong> : nom, prénom, surnom, initiales (« M. X », « la prof de SVT de
            2nde 3 »), ou toute description qui permet de reconnaître quelqu’un. Dans un petit lycée, « le prof d’allemand » ou « la
            nouvelle surveillante » suffit souvent à identifier une personne : c’est interdit aussi.
          </li>
          <li>
            <strong>Les insultes, moqueries et propos méprisants</strong>, envers qui que ce soit.
          </li>
          <li>
            <strong>Le harcèlement</strong>, même déguisé, et les contenus qui s’acharnent sur quelqu’un.
          </li>
          <li>
            <strong>Les accusations</strong> contre une personne (« il vole », « elle ment », « il est violent »…). Si tu es témoin ou
            victime de faits graves, ce site n’est pas le bon endroit : parles-en à un adulte ou consulte la page{" "}
            <Link href="/aide">Besoin d’aide ?</Link>
          </li>
          <li>
            <strong>Les données personnelles</strong> : numéro de téléphone, adresse, e-mail, pseudo de réseau social, photo, classe
            précise d’un élève… les tiennes comme celles des autres.
          </li>
          <li>
            <strong>Les menaces</strong>, et les appels à la violence ou à la dégradation.
          </li>
        </ul>

        <h2>Exemples</h2>
        <div className="sl-examples">
          <Example ok text="Depuis plusieurs jours, plusieurs salles du bâtiment B n’ont plus de chauffage." note="Une situation, un lieu, une durée. Parfait." />
          <Example ok={false} text="M. X est nul et ne fait jamais ses cours." note="Vise une personne (même avec une initiale) et contient un jugement insultant." />
        </div>

        <h3>Un cas limite</h3>
        <p>Le même problème peut être dit de deux façons :</p>
        <div className="sl-examples">
          <Example
            ok={false}
            text="Prof de maths non remplacé depuis 3 semaines"
            note="On parle d’une personne. Dans un lycée, ça peut suffire à l’identifier, et ce n’est pas sa faute si elle est absente."
          />
          <Example
            ok
            text="Cours de maths non assurés depuis 3 semaines en 1re"
            note="On parle de la situation : des cours qui manquent aux élèves. C’est exactement ce qu’il faut faire remonter."
          />
        </div>

        <h2>Si ton signalement est refusé ou modifié</h2>
        <p>
          Les signalements sont vérifiés automatiquement puis, si besoin, relus par une personne. Un signalement peut être refusé, ou
          reformulé pour retirer un détail qui identifie quelqu’un. Chaque décision est motivée : tu vois la raison grâce à ton
          lien de suivi. Si tu penses qu’il y a une erreur, tu peux nous écrire via la <Link href="/contact">page de contact</Link>.
        </p>

        <h2>Tu vois un contenu qui ne respecte pas ces règles ?</h2>
        <p>
          Utilise le bouton <strong>« Signaler un contenu »</strong> sur le problème concerné et choisis le motif (personne visée,
          données personnelles, insulte ou harcèlement, faux ou diffamatoire, autre). Il sera relu par une personne.
        </p>
      </div>
    </>
  );
}
