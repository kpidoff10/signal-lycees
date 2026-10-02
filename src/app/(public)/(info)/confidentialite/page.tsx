import type { Metadata } from "next";
import Link from "next/link";
import { PRIVACY_EMAIL } from "@/lib/contact";
import { InfoHeader, Todo } from "../_components/InfoHeader";

export const metadata: Metadata = {
  title: "Confidentialité",
  description:
    "Quelles données Signal Lycées traite, pourquoi, combien de temps et avec qui : pas de compte, pas d’e-mail, pas de nom, pas de publicité ni de pistage.",
};

const DATA_ROWS: { what: string; why: string; duration: string; who: string }[] = [
  {
    what: "Identité anonyme : un identifiant aléatoire signé, rangé dans le cookie technique « sl_id »",
    why: "Te permettre de participer sans compte : compter une seule fois ta confirmation, retrouver tes votes, limiter les abus",
    duration: "Cookie : 1 an. L’identité est supprimée après 12 mois sans activité",
    who: "L’éditeur ; hébergeurs (Vercel, Neon)",
  },
  {
    what: "Signalement publié : lycée, catégorie, titre, description, date",
    why: "Faire fonctionner le service : afficher le problème et la carte",
    duration: "Tant que le signalement est en ligne, jusqu’à sa suppression (à ta demande ou par la modération)",
    who: "Public (après modération) ; hébergeurs",
  },
  {
    what: "Texte original que tu as saisi (avant une éventuelle reformulation)",
    why: "Modération : vérifier la décision en cas de contestation ou de signalement",
    duration: "Purgé 90 jours après la décision de modération",
    who: "L’éditeur (modération) ; hébergeurs",
  },
  {
    what: "Votes : « Je rencontre aussi ce problème », « pas sérieux », « semble résolu », liés à ton identité anonyme",
    why: "Éviter les votes en double, faire évoluer le statut des problèmes, repérer les signalements contestés",
    duration: "Supprimés avec ton identité anonyme (12 mois sans activité). Le 👎 n’est jamais affiché publiquement",
    who: "L’éditeur ; hébergeurs. Seuls des totaux 👍 sont publics",
  },
  {
    what: "Empreinte de ton adresse IP (calcul HMAC avec un sel qui change chaque jour). L’IP elle-même n’est jamais stockée",
    why: "Sécurité : limitation de débit et lutte contre les abus",
    duration: "En mémoire le temps de la fenêtre de limitation, 24 h au plus",
    who: "Upstash (limitation de débit)",
  },
  {
    what: "Analyses automatiques de modération (résultat du classement du texte)",
    why: "Modération et sécurité ; amélioration des règles",
    duration: "12 mois",
    who: "L’éditeur ; Jev (TypeSafe AI) reçoit uniquement le texte du signalement",
  },
  {
    what: "Représentation numérique du texte (« embedding »)",
    why: "Repérer les doublons et te proposer un problème déjà signalé",
    duration: "Conservée avec le signalement",
    who: "Voyage AI (calcul) ; hébergeurs",
  },
  {
    what: "Signalement de contenu : motif et commentaire facultatif",
    why: "Modération (obligation de traiter les notifications, DSA)",
    duration: "12 mois après son traitement par la modération",
    who: "L’éditeur ; hébergeurs",
  },
  {
    what: "Demande envoyée via le formulaire de contact : message, référence du signalement, moyen de contact si tu en donnes un",
    why: "Répondre à ta demande (suppression, exercice de tes droits, contact)",
    duration: "12 mois après son traitement",
    who: "L’éditeur ; hébergeurs",
  },
  {
    what: "E-mail que tu choisis de nous envoyer : ton adresse e-mail et ton message",
    why: "Répondre à ton message",
    duration: "12 mois après le dernier échange",
    who: "L’éditeur ; Hostinger (messagerie)",
  },
  {
    what: "Statistiques de visite agrégées (pages vues, sans cookie)",
    why: "Savoir quelles pages sont utiles",
    duration: "Données agrégées, sans donnée personnelle",
    who: "Plausible Analytics",
  },
];

export default function ConfidentialitePage() {
  return (
    <>
      <InfoHeader
        eyebrow="Tes données"
        title="Politique de confidentialité"
        lead="Signal Lycées est conçu pour fonctionner en sachant le moins possible sur toi. Voici, sans jargon, ce qui est traité, pourquoi, et comment garder la main."
        updated="2 octobre 2026"
      />

      <div className="sl-prose">
        <section className="sl-callout is-resolved" aria-labelledby="en-bref">
          <h2 id="en-bref" className="sl-callout-title" style={{ marginTop: 0 }}>
            En bref
          </h2>
          <ul>
            <li>
              <strong>Pas de compte, pas d’adresse e-mail, pas de nom.</strong> On ne te demande rien qui permette de savoir qui tu es.
            </li>
            <li>
              Un <strong>cookie technique</strong> contient un identifiant tiré au hasard. Il sert seulement à compter ta participation
              une seule fois.
            </li>
            <li>
              Ton <strong>adresse IP n’est jamais enregistrée</strong> telle quelle : on en garde une empreinte brouillée, 24 h au plus,
              pour bloquer les abus.
            </li>
            <li>
              <strong>Pas de publicité, pas de pistage, aucune revente.</strong> Les statistiques de visite se font sans cookie.
            </li>
            <li>
              Le texte de ton signalement est vérifié par des outils automatiques (dont une IA) et parfois par une personne. Ils ne
              reçoivent jamais d’information sur ton identité.
            </li>
            <li>
              Tu peux demander la suppression de ton signalement à tout moment avec ton <strong>lien de suivi</strong>, ou via la{" "}
              <Link href="/contact">page de contact</Link>.
            </li>
          </ul>
        </section>

        <h2>Qui est responsable de tes données ?</h2>
        <p>
          Le responsable de traitement est <strong>Kevin Pidoff</strong>, une personne physique qui édite Signal Lycées à titre non
          professionnel (voir les <Link href="/mentions-legales">mentions légales</Link>). Pour toute question ou pour exercer tes
          droits, utilise la <Link href="/contact">page de contact</Link> ou écris à{" "}
          <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a> : c’est le moyen de joindre directement le responsable de
          traitement.
        </p>

        <h2>Ce qu’on ne collecte pas</h2>
        <p>
          Aucun nom, prénom, adresse e-mail, numéro de téléphone, date de naissance, photo de profil ou localisation précise. Il n’y
          a pas de compte élève. Les règles de publication interdisent aussi d’écrire des informations personnelles dans un
          signalement, et la modération les retire.
        </p>

        <h2>Les données traitées, en détail</h2>
        <div className="sl-table-wrap" role="region" aria-label="Tableau des données traitées" tabIndex={0}>
          <table className="sl-table">
            <thead>
              <tr>
                <th scope="col">Donnée</th>
                <th scope="col">Pourquoi</th>
                <th scope="col">Combien de temps</th>
                <th scope="col">Qui y a accès</th>
              </tr>
            </thead>
            <tbody>
              {DATA_ROWS.map((r) => (
                <tr key={r.what}>
                  <th scope="row">{r.what}</th>
                  <td>{r.why}</td>
                  <td>{r.duration || <Todo>durée de conservation</Todo>}</td>
                  <td>{r.who}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Les administrateurs du site utilisent en plus un cookie de session pour se connecter à l’espace de modération. Il ne
          concerne pas les élèves.
        </p>

        <h2>Sur quelle base légale ?</h2>
        <p>
          Ces traitements reposent sur l’<strong>intérêt légitime</strong> (article 6.1.f du RGPD) : faire fonctionner le service,
          le modérer et le protéger contre les abus. Ils ne reposent pas sur ton consentement.
        </p>
        <p>
          En France, la « majorité numérique » est fixée à <strong>15 ans</strong> : en dessous, un service qui repose sur le
          consentement doit aussi obtenir celui d’un parent. Ce n’est pas le cas ici, puisque le site ne repose pas sur le
          consentement et ne collecte aucune donnée qui t’identifie.
        </p>

        <h2>Les cookies</h2>
        <ul>
          <li>
            <strong>sl_id</strong> : cookie technique (inaccessible aux scripts de la page), qui contient ton identité anonyme. Durée :
            1 an. Il est indispensable au fonctionnement des votes, c’est pourquoi aucun bandeau ne te demande ton accord.
          </li>
          <li>
            <strong>Cookie de session administrateur</strong> : uniquement pour les personnes qui modèrent le site.
          </li>
          <li>
            Aucun cookie publicitaire ou de mesure d’audience : Plausible fonctionne sans cookie.
            {" "}La fréquentation (nombre de visiteurs et de pages vues) est mesurée sans cookie, directement par le site : une empreinte
            anonyme du jour, calculée à partir de l’adresse IP et du navigateur avec une clé qui change chaque jour, sert seulement à ne pas
            compter deux fois la même visite ; elle est effacée le lendemain. Seuls des totaux par jour sont conservés. Les navigateurs qui
            demandent à ne pas être suivis (« Do Not Track », « Global Privacy Control ») ne sont pas comptés.
            {" "}Les liens courts que nous partageons (par exemple signal-lycees.fr/eqaqj, ou le QR code des affiches) indiquent seulement
            par quel canal tu es arrivé : ils ne contiennent rien sur toi et ne sont pas reliés à ton identité anonyme.
          </li>
        </ul>
        <p>Tu peux supprimer le cookie sl_id à tout moment dans ton navigateur : tu repartiras avec une nouvelle identité anonyme.</p>

        <h2>La modération automatique</h2>
        <p>Avant publication, chaque signalement passe par :</p>
        <ul>
          <li>des règles automatiques (repérage de noms, d’insultes, de coordonnées…) ;</li>
          <li>
            <strong>Jev</strong>, un service d’intelligence artificielle de <strong>TypeSafe AI</strong> qui classe le texte (par
            exemple : vise-t-il une personne ?). Il reçoit seulement le titre et la description, sans aucune donnée d’identité ;
          </li>
          <li>une relecture humaine par l’éditeur pour les cas douteux, contestés ou signalés.</li>
        </ul>
        <p>
          Ces outils évaluent un texte, pas une personne. Les décisions de modération sont motivées, et tu peux demander qu’une
          personne les réexamine via la <Link href="/contact">page de contact</Link>.
        </p>

        <h2>Les prestataires (sous-traitants)</h2>
        <dl>
          <div>
            <dt>Vercel Inc. (États-Unis)</dt>
            <dd>Hébergement de l’application.</dd>
          </div>
          <div>
            <dt>Neon</dt>
            <dd>Base de données PostgreSQL, hébergée à Londres (Royaume-Uni), pays reconnu par la Commission européenne comme offrant un niveau de protection adéquat.</dd>
          </div>
          <div>
            <dt>Upstash</dt>
            <dd>Mémoire temporaire pour la limitation de débit (empreintes d’IP, 24 h au plus).</dd>
          </div>
          <div>
            <dt>TypeSafe AI (Jev)</dt>
            <dd>Analyse automatique du texte des signalements pour la modération.</dd>
          </div>
          <div>
            <dt>Voyage AI</dt>
            <dd>Calcul des représentations numériques du texte, pour détecter les doublons.</dd>
          </div>
          <div>
            <dt>Cloudflare (Turnstile)</dt>
            <dd>
              Vérification anti-robot au moment de signaler. Cloudflare traite pour cela des informations techniques de ton navigateur.
            </dd>
          </div>
          <div>
            <dt>Plausible Analytics</dt>
            <dd>Statistiques de visite, sans cookie et sans donnée personnelle ni texte de signalement.</dd>
          </div>
          <div>
            <dt>Hostinger</dt>
            <dd>Messagerie de l’éditeur (adresses en @signal-lycees.fr) : reçoit seulement les e-mails que tu choisis de nous envoyer.</dd>
          </div>
          <div>
            <dt>Telegram</dt>
            <dd>
              Alertes internes envoyées à l’éditeur quand un signalement est à vérifier. Elles contiennent seulement le nom du lycée, la
              catégorie et un lien vers l’espace de modération : jamais le texte d’un signalement ni aucune donnée sur son auteur.
            </dd>
          </div>
        </dl>
        <p>
          Certains de ces prestataires sont situés hors de l’Union européenne. Garanties encadrant ces transferts :{" "}
          les prestataires établis aux États-Unis (Vercel, Cloudflare, Upstash, Voyage AI, TypeSafe AI via Vercel) sont encadrés par
          les clauses contractuelles types de la Commission européenne et, lorsqu’ils y adhèrent, par le cadre de protection des données
          UE–États-Unis (Data Privacy Framework). La base de données est hébergée au Royaume-Uni, pays qui bénéficie d’une décision
          d’adéquation de la Commission européenne.
        </p>

        <h2>Tes droits</h2>
        <p>Même sans compte, tu as des droits sur les données qui te concernent :</p>
        <ul>
          <li>
            <strong>accès</strong> : savoir ce qui est conservé ;
          </li>
          <li>
            <strong>rectification</strong> : corriger une information ;
          </li>
          <li>
            <strong>effacement</strong> : faire supprimer ton signalement ;
          </li>
          <li>
            <strong>opposition</strong> : t’opposer à un traitement fondé sur l’intérêt légitime ;
          </li>
          <li>
            <strong>limitation</strong> : demander le gel d’un traitement le temps d’une vérification.
          </li>
        </ul>
        <h3>Comment les exercer sans compte ?</h3>
        <p>
          Remplis le <Link href="/contact">formulaire de contact</Link> en indiquant ton <strong>lien de suivi</strong> (reçu après
          ton signalement) ou l’<strong>adresse de la page du signalement</strong>. Comme on ne sait pas qui tu es, ce lien est le
          seul moyen de relier une demande à un signalement : garde-le précieusement et ne le partage pas. Ton lien de suivi permet
          aussi de demander directement la suppression.
        </p>
        <p>
          Tu peux aussi écrire à <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>, mais un e-mail nous montre ton adresse :
          le formulaire reste le moyen le plus anonyme.
        </p>
        <p>
          Tu peux aussi supprimer ton identité anonyme toi-même en effaçant le cookie sl_id de ton navigateur. Tu n’as pas besoin
          de l’accord de tes parents pour exercer ces droits.
        </p>

        <h2>Réclamation auprès de la CNIL</h2>
        <p>
          Si tu penses que tes droits ne sont pas respectés, tu peux adresser une réclamation à la Commission nationale de
          l’informatique et des libertés (CNIL), en ligne sur{" "}
          <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">
            cnil.fr/fr/plaintes
          </a>{" "}
          ou par courrier : CNIL, 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
        </p>

        <h2>Sécurité</h2>
        <p>
          Les échanges sont chiffrés (HTTPS), l’identifiant du cookie est signé pour ne pas pouvoir être falsifié, le lien de suivi
          n’est conservé que sous forme d’empreinte, et l’adresse IP n’est jamais stockée en clair.
        </p>

        <h2>Modifications</h2>
        <p>
          Cette politique peut évoluer avec le service. La date de dernière mise à jour figure en haut de la page.
        </p>
      </div>
    </>
  );
}
