import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, PRESS_EMAIL } from "@/lib/contact";
import { InfoHeader } from "../_components/InfoHeader";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Éditeur, hébergement, point de contact, sources de données et crédits de Signal Lycées.",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <InfoHeader eyebrow="Informations légales" title="Mentions légales" updated="2 octobre 2026" />

      <div className="sl-prose">
        <h2>Éditeur</h2>
        <p>
          Signal Lycées est édité par <strong>Kevin Pidoff</strong>, personne physique agissant à titre non professionnel. Le site est
          gratuit, sans publicité et sans but lucratif.
        </p>
        <p>
          Conformément à l’article 6, III, 2° de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN),
          l’éditeur a choisi de ne pas rendre publiques ses coordonnées personnelles. Ses éléments d’identification ont été communiqués
          à l’hébergeur, dont les coordonnées figurent ci-dessous.
        </p>
        <p>
          Pour contacter l’éditeur : <Link href="/contact">page de contact</Link> ou{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> (presse : <a href={`mailto:${PRESS_EMAIL}`}>{PRESS_EMAIL}</a>). Chaque message est lu et reçoit une réponse si tu
          laisses un moyen de te recontacter.
        </p>

        <h2>Directeur de la publication</h2>
        <p>Kevin Pidoff.</p>

        <h2>Hébergement</h2>
        <p>
          <strong>Application</strong> : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
        </p>
        <p>
          <strong>Base de données</strong> : Neon (PostgreSQL), données hébergées à Londres (Royaume-Uni, pays bénéficiant d’une décision d’adéquation de la Commission européenne).
        </p>

        <h2>Point de contact unique (DSA)</h2>
        <p>
          Conformément au règlement européen sur les services numériques (DSA), le point de contact unique pour les autorités des
          États membres, la Commission européenne et les utilisateurs est la <Link href="/contact">page de contact</Link> (choisis
          « Autre demande ou contact DSA ») ou l’adresse <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Langue acceptée : français.
        </p>
        <p>
          Pour signaler un contenu illicite précis, utilise de préférence le bouton « Signaler un contenu » présent sur chaque
          problème.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Voir la <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>

        <h2>Sources de données</h2>
        <ul>
          <li>
            Liste des établissements : <strong>Annuaire de l’éducation</strong> (ministère de l’Éducation nationale), publié sous{" "}
            <a href="https://www.etalab.gouv.fr/licence-ouverte-open-licence/" target="_blank" rel="noopener noreferrer">
              Licence Ouverte (Etalab)
            </a>
            .
          </li>
          <li>
            Contours des régions et départements : données <strong>IGN / INSEE</strong>, via le projet{" "}
            <a href="https://github.com/gregoiredavid/france-geojson" target="_blank" rel="noopener noreferrer">
              france-geojson
            </a>
            .
          </li>
        </ul>

        <h2>Polices de caractères</h2>
        <p>
          <strong>Bricolage Grotesque</strong> et <strong>Instrument Sans</strong>, sous licence SIL Open Font License (OFL).
        </p>

        <h2>Code source</h2>
        <p>
          Signal Lycées est un logiciel libre sous licence AGPL-3.0. Voir les{" "}
          <Link href="/cgu">conditions d’utilisation</Link>.
        </p>
      </div>
    </>
  );
}
