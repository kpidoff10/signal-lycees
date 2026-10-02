import type { Metadata } from "next";
import Link from "next/link";
import { InfoHeader, Todo } from "../_components/InfoHeader";

export const metadata: Metadata = {
  title: "Conditions d’utilisation",
  description:
    "Les conditions d’utilisation de Signal Lycées : service gratuit, règles de contenu, modération motivée, signalement des contenus, licence libre AGPL-3.0.",
};

export default function CguPage() {
  return (
    <>
      <InfoHeader
        eyebrow="Le cadre"
        title="Conditions d’utilisation"
        lead="En utilisant Signal Lycées, tu acceptes ces conditions. Elles sont écrites pour être comprises : si quelque chose n’est pas clair, écris-nous."
        updated="2 octobre 2026"
      />

      <div className="sl-prose">
        <h2>1. Objet du service</h2>
        <p>
          Signal Lycées permet aux lycéennes et lycéens de France de signaler anonymement des problèmes concernant le fonctionnement
          ou l’état de leur établissement, de confirmer les problèmes signalés par d’autres, d’indiquer qu’un problème semble résolu
          et de consulter ces informations sur une carte. Le service porte sur des <strong>situations</strong>, jamais sur des
          personnes. Il ne note pas et ne classe pas les établissements.
        </p>
        <p>
          Le service est édité par Kevin Pidoff, personne physique (voir les <Link href="/mentions-legales">mentions légales</Link>).
        </p>

        <h2>2. Gratuité et accès</h2>
        <p>
          Le service est gratuit, sans publicité et sans compte. Il est accessible à toute personne disposant d’un accès à Internet.
          L’éditeur s’efforce de le maintenir disponible mais ne peut le garantir en permanence : il peut être interrompu pour
          maintenance, en cas de problème technique ou pour protéger les utilisateurs.
        </p>
        <p>
          Signal Lycées <strong>n’est pas un service d’urgence</strong> ni d’écoute. En cas de danger ou de détresse, consulte la
          page <Link href="/aide">Besoin d’aide ?</Link>
        </p>

        <h2>3. Règles de contenu</h2>
        <p>
          Tout contenu publié doit respecter les <Link href="/regles">règles de publication</Link>, qui font partie de ces
          conditions. En particulier, il est interdit de publier :
        </p>
        <ul>
          <li>un nom, un surnom, des initiales ou une description permettant d’identifier une personne ;</li>
          <li>des insultes, des propos haineux, du harcèlement ou des menaces ;</li>
          <li>des accusations contre une personne ou des propos diffamatoires ;</li>
          <li>des données personnelles (les tiennes ou celles d’autres personnes) ;</li>
          <li>des informations que tu sais fausses ;</li>
          <li>tout contenu illégal.</li>
        </ul>
        <p>
          Il est aussi interdit de perturber le service : votes automatisés ou répétés, contournement des limites, tentative
          d’accès non autorisé, publication en masse.
        </p>

        <h2>4. Modération et motivation des décisions</h2>
        <p>
          Les signalements sont vérifiés par des règles automatiques, par un outil d’analyse automatique du texte et, si besoin, par
          une relecture humaine. L’éditeur peut refuser un signalement, le reformuler pour retirer un élément interdit (par exemple
          un détail qui identifie une personne), le dépublier ou le supprimer.
        </p>
        <p>
          Conformément au règlement européen sur les services numériques (DSA), chaque décision de refus, de modification ou de
          retrait est <strong>motivée</strong> : l’auteur en voit la raison grâce à son lien de suivi. Il peut contester la décision
          en écrivant via la <Link href="/contact">page de contact</Link> ; la contestation est examinée par une personne.
        </p>
        <p>
          Les mentions « pas sérieux » (👎) ne retirent jamais un contenu automatiquement : au-delà d’un certain nombre, elles
          déclenchent une relecture humaine.
        </p>

        <h2>5. Signaler un contenu</h2>
        <p>
          Chaque problème publié comporte un bouton <strong>« Signaler un contenu »</strong>. Tu peux indiquer l’un des motifs
          suivants : personne visée, données personnelles, insulte ou harcèlement, contenu faux ou diffamatoire, autre. Chaque
          signalement est examiné, et les contenus manifestement illicites sont retirés rapidement. Les signalements abusifs
          répétés peuvent être ignorés.
        </p>
        <p>
          Les autorités et toute personne souhaitant contacter l’éditeur au titre du DSA peuvent utiliser le point de contact
          unique : la <Link href="/contact">page de contact</Link>.
        </p>

        <h2>6. Ton lien de suivi</h2>
        <p>
          Après un signalement, tu reçois un lien de suivi secret. Il te permet de voir l’état de ton signalement et d’en demander la
          suppression. Toute personne qui possède ce lien peut faire de même : ne le partage pas. Il ne peut pas être renvoyé s’il
          est perdu, puisque le service ne connaît pas ton identité.
        </p>

        <h2>7. Contenus des utilisateurs</h2>
        <p>
          Tu restes responsable de ce que tu publies. En publiant un signalement, tu autorises l’éditeur, gratuitement, pour le
          monde entier et pour la durée de sa mise en ligne, à l’afficher sur le site et sur la carte, à le reproduire dans les
          statistiques du service et à le reformuler pour le rendre conforme aux règles. Le signalement est publié sans aucune
          mention de ton identité.
        </p>

        <h2>8. Responsabilité</h2>
        <p>
          L’éditeur agit en tant qu’hébergeur des contenus publiés par les utilisateurs : il n’en vérifie pas l’exactitude a priori
          et n’en est pas l’auteur. Il retire promptement les contenus illicites qui lui sont signalés. Les informations affichées
          reflètent ce que les élèves déclarent : elles ne constituent pas un constat officiel sur un établissement.
        </p>
        <p>
          L’éditeur ne peut être tenu responsable d’une interruption du service, d’une perte de données, ni de l’usage que des tiers
          font des informations publiées.
        </p>

        <h2>9. Licence du code</h2>
        <p>
          Le code source de Signal Lycées est un logiciel libre, publié sous licence{" "}
          <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer">
            GNU Affero General Public License v3.0 (AGPL-3.0)
          </a>
          . Code source : <Todo>adresse du dépôt du code source</Todo>. Cette licence porte sur le code, pas sur les contenus publiés
          par les utilisateurs.
        </p>

        <h2>10. Modification des conditions</h2>
        <p>
          Ces conditions peuvent évoluer, par exemple si le service change ou si la loi l’impose. La date de dernière mise à jour
          figure en haut de la page. Les nouvelles conditions s’appliquent dès leur publication.
        </p>

        <h2>11. Droit applicable</h2>
        <p>
          Ces conditions sont soumises au droit français. En cas de désaccord, on cherchera d’abord une solution à l’amiable via la{" "}
          <Link href="/contact">page de contact</Link> ; à défaut, les tribunaux français seront compétents.
        </p>
      </div>
    </>
  );
}
