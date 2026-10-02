import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { STATUS_RULES } from "@/server/status";
import { InfoHeader } from "../_components/InfoHeader";

export const metadata: Metadata = {
  title: "Comment ça marche",
  description:
    "Signaler un problème dans ton lycée, confirmer ceux des autres, dire qu’un problème semble résolu : tout ce qu’il faut savoir sur Signal Lycées, anonyme et sans classement.",
};

export default function CommentCaMarchePage() {
  return (
    <>
      <InfoHeader
        eyebrow="Le principe"
        title="Comment ça marche"
        lead="Signal Lycées permet aux lycéennes et lycéens de faire remonter ce qui ne va pas dans leur établissement : chauffage en panne, toilettes fermées, cours non assurés… Seul·e, on a du mal à se faire entendre. À plusieurs, ça devient visible."
      />

      <div className="sl-prose">
        <h2>Ce que tu peux faire</h2>
        <ol className="sl-steps">
          <li>
            <h3>Signaler un problème</h3>
            <p>
              Tu choisis ton lycée, une catégorie, et tu décris la situation en quelques phrases. Tu parles d’une
              <strong> situation</strong>, jamais d’une personne : c’est la règle la plus importante (voir les{" "}
              <Link href="/regles">règles de publication</Link>).
            </p>
          </li>
          <li>
            <h3>Confirmer : « Je rencontre aussi ce problème »</h3>
            <p>
              Si un problème déjà signalé te concerne aussi, appuie sur 👍. Pas besoin de le signaler une deuxième fois : chaque
              confirmation montre que le problème touche plusieurs élèves.
            </p>
          </li>
          <li>
            <h3>Dire qu’un signalement « n’est pas sérieux »</h3>
            <p>
              Le 👎 sert à indiquer un signalement qui te paraît exagéré ou pas sérieux. Ce chiffre n’est jamais affiché
              publiquement et ne supprime rien tout seul : quand il y en a beaucoup, une personne relit le signalement.
            </p>
          </li>
          <li>
            <h3>Dire qu’un problème « semble résolu »</h3>
            <p>Le chauffage remarche ? Les toilettes ont rouvert ? Tu peux l’indiquer. On t’explique juste en dessous ce qui se passe ensuite.</p>
          </li>
        </ol>

        <h2>Quand un problème est-il « résolu » ?</h2>
        <p>
          <strong>Un vote ne suffit jamais à résoudre un problème.</strong> Sinon, une seule personne pourrait faire disparaître une
          situation bien réelle.
        </p>
        <ul>
          <li>
            Quand plusieurs élèves (au moins {STATUS_RULES.minResolvedVotes}) indiquent récemment que le problème semble résolu, il
            passe en <strong>« peut-être résolu »</strong>.
          </li>
          <li>
            Si d’autres élèves confirment ensuite qu’ils rencontrent toujours le problème, il redevient <strong>actif</strong>.
          </li>
          <li>
            S’il n’y a plus aucune confirmation pendant {STATUS_RULES.autoResolveDays} jours, il passe en <strong>résolu</strong>. Un
            modérateur peut aussi valider la résolution.
          </li>
        </ul>

        <h2>Qui vérifie ce qui est publié ?</h2>
        <p>Chaque signalement passe par plusieurs filets de sécurité avant et après sa publication :</p>
        <ul>
          <li>des <strong>règles automatiques</strong> repèrent les noms, insultes, numéros de téléphone et autres contenus interdits ;</li>
          <li>
            un <strong>outil d’analyse automatique</strong> (une intelligence artificielle qui classe le texte) aide à repérer les
            contenus qui visent une personne ou sont dangereux. Il ne reçoit que le texte du signalement, rien qui permette de savoir
            qui tu es ;
          </li>
          <li>
            une <strong>personne relit</strong> les cas douteux, les signalements de contenu et les publications contestées, et
            prend la décision finale.
          </li>
        </ul>
        <p>
          Chaque problème publié a un bouton <strong>« Signaler un contenu »</strong>, si tu penses qu’il vise quelqu’un, contient des
          données personnelles ou est faux. Quand un contenu est refusé ou retiré, la décision est motivée.
        </p>

        <h2>La carte : des faits, pas un classement</h2>
        <p>
          La carte de France montre où des problèmes sont signalés et combien d’élèves les confirment. Elle ne donne{" "}
          <strong>jamais de note</strong> aux lycées et il n’y a <strong>aucun palmarès</strong>. Un lycée avec beaucoup de
          signalements n’est pas « pire » qu’un autre : c’est souvent un lycée où les élèves s’expriment davantage. Les chiffres
          comptent des signalements, ils ne jugent pas les établissements ni les personnes qui y travaillent.
        </p>

        <h2>Et ton anonymat ?</h2>
        <ul>
          <li>Pas de compte, pas d’adresse e-mail, pas de nom : on ne te demande rien qui permette de t’identifier.</li>
          <li>
            Ton navigateur garde un petit cookie technique avec un identifiant au hasard. Il sert seulement à éviter qu’une même
            personne confirme dix fois le même problème.
          </li>
          <li>Ton adresse IP n’est jamais enregistrée telle quelle.</li>
          <li>Pas de publicité, pas de pistage, aucune revente de données.</li>
        </ul>
        <p>
          Après avoir signalé un problème, tu reçois un <strong>lien de suivi secret</strong>. Garde-le : il te permet de voir où en
          est ton signalement et d’en demander la suppression. Tous les détails sont dans la{" "}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>

        <div className="sl-callout">
          <p className="sl-callout-title">Tu vis une situation difficile ?</p>
          <p>
            Signal Lycées n’est pas un service d’urgence. Si tu es en danger, harcelé·e ou si tu ne vas pas bien, regarde la page{" "}
            <Link href="/aide">Besoin d’aide ?</Link> : des gens peuvent t’écouter tout de suite.
          </p>
        </div>

        <p>
          <ButtonLink href="/signaler" icon="flag">
            Signaler un problème
          </ButtonLink>
        </p>
      </div>
    </>
  );
}
