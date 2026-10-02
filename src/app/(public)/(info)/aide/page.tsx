import type { Metadata } from "next";
import Link from "next/link";
import { InfoHeader } from "../_components/InfoHeader";
import { HelpResources } from "./HelpResources";

export const metadata: Metadata = {
  title: "Besoin d’aide ?",
  description:
    "Tu ne vas pas bien, tu es harcelé·e ou en danger ? Des numéros gratuits et des adultes peuvent t’aider : 3114, 119, 3018, Fil Santé Jeunes, 112.",
};

export default function AidePage() {
  return (
    <>
      <InfoHeader
        eyebrow="Tu n’es pas seul·e"
        title="Besoin d’aide ?"
        lead="Si quelque chose te fait du mal, à toi ou à quelqu’un que tu connais, tu as le droit d’en parler et d’être aidé·e. Les numéros ci-dessous sont gratuits, et les personnes qui répondent sont là pour ça."
      />

      <div className="sl-prose">
        <div className="sl-callout is-signal" role="note">
          <p className="sl-callout-title">En danger maintenant ?</p>
          <p>
            Appelle le <a href="tel:112">112</a> ou le <a href="tel:17">17</a>, ou demande de l’aide à l’adulte le plus proche.
            N’attends pas.
          </p>
        </div>

        <h2>Des numéros pour parler</h2>
        <p>Tu peux appeler même si tu ne sais pas par où commencer. Tu n’as pas besoin d’être « sûr·e » que ta situation est grave.</p>
        <HelpResources />

        <h2>Parler à quelqu’un au lycée</h2>
        <p>Tu peux aussi aller voir, sans rendez-vous si besoin :</p>
        <ul>
          <li>
            <strong>l’infirmière ou l’infirmier scolaire</strong>, tenu·e au secret professionnel ;
          </li>
          <li>
            <strong>le ou la CPE</strong> (conseiller·e principal·e d’éducation) ;
          </li>
          <li>
            <strong>un adulte de confiance</strong> : un prof, un·e assistant·e d’éducation, un·e psychologue de l’Éducation nationale,
            un parent, un·e coach, un·e proche…
          </li>
        </ul>
        <p>Si la première personne ne t’écoute pas comme tu le voudrais, essaie avec une autre. Ça vaut le coup.</p>

        <h2>Et Signal Lycées dans tout ça ?</h2>
        <p>
          Signal Lycées sert à faire remonter des problèmes <strong>collectifs</strong> dans un lycée (chauffage, toilettes, cours non
          assurés…). Ce n’est pas un service d’écoute ni d’urgence : personne ne lit les signalements en temps réel, et on ne peut
          pas te recontacter. Si tu vis une situation difficile, les numéros ci-dessus sont bien plus utiles.
        </p>
        <p>
          Si un contenu publié sur le site te vise ou te met mal à l’aise, tu peux le signaler avec le bouton « Signaler un contenu »
          ou nous écrire via la <Link href="/contact">page de contact</Link>.
        </p>
      </div>
    </>
  );
}
