import type { Metadata } from "next";
import Link from "next/link";
import { InfoHeader, Todo } from "../_components/InfoHeader";

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
          Signal Lycées est édité par <strong>Kevin Pidoff</strong>, personne physique.
          <br />
          Adresse : <Todo>adresse postale de l’éditeur</Todo>
          <br />
          Contact : <Todo>adresse e-mail ou téléphone de contact de l’éditeur</Todo>, ou la{" "}
          <Link href="/contact">page de contact</Link>.
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
          « Autre demande ou contact DSA »). Langue(s) acceptée(s) : <Todo>langue(s) de communication du point de contact, ex. français</Todo>.
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
