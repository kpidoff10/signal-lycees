import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PRESS_EMAIL } from "@/lib/contact";
import { formatNumber } from "@/lib/format";
import { PUBLIC_ISSUE_WHERE } from "@/server/issues";
import { activeWhere } from "@/server/mobilizations";
import { InfoHeader } from "../_components/InfoHeader";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Espace presse",
  description:
    "Signal Lycées en bref : ce que c’est, les chiffres à jour, comment les lire et le contact presse (presse@signal-lycees.fr).",
};

async function pressFigures() {
  const [byOrigin, schools, confirmations, mobs] = await Promise.all([
    prisma.issue.groupBy({ by: ["origin"], where: PUBLIC_ISSUE_WHERE, _count: true }),
    prisma.issue.findMany({ where: PUBLIC_ISSUE_WHERE, distinct: ["schoolId"], select: { schoolId: true } }),
    prisma.issue.aggregate({ where: PUBLIC_ISSUE_WHERE, _sum: { upCount: true } }),
    prisma.mobilization.count({ where: activeWhere() }),
  ]);
  const count = (o: "STUDENT" | "PRESS") => byOrigin.find((r) => r.origin === o)?._count ?? 0;
  return {
    student: count("STUDENT"),
    press: count("PRESS"),
    schools: schools.length,
    confirmations: confirmations._sum.upCount ?? 0,
    mobs,
  };
}

export default async function PressePage() {
  const f = await pressFigures().catch(() => null);

  return (
    <>
      <InfoHeader
        eyebrow="Presse"
        title="Espace presse"
        lead="Signal Lycées en quelques lignes, les chiffres à jour et la façon de les lire. Pour une question ou une interview, écris-nous."
      />

      <div className="sl-prose">
        <div className="sl-callout is-signal">
          <p className="sl-callout-title">Contact presse</p>
          <p>
            <a href={`mailto:${PRESS_EMAIL}`}>{PRESS_EMAIL}</a> : chaque message est lu et reçoit une réponse.
          </p>
        </div>

        <h2>En bref</h2>
        <p>
          Signal Lycées est un site gratuit où les lycéens signalent, <strong>anonymement</strong>, les problèmes de leur
          établissement : locaux, sanitaires, cantine, sécurité, vie scolaire. Les autres élèves confirment ce qu’ils vivent aussi,
          et une carte de France montre les lycées concernés ainsi que les mobilisations en cours.
        </p>
        <p>
          Pas de compte, pas d’adresse e-mail, aucune donnée personnelle demandée. Chaque signalement est modéré avant publication,
          et aucune personne ne peut y être nommée.
        </p>

        {f && (
          <>
            <h2>Les chiffres</h2>
            <p className="text-[15px] leading-[22px] text-ink-muted">Mis à jour toutes les heures.</p>
            <dl>
              {f.student > 0 && (
              <div>
                <dt>{formatNumber(f.student)} problèmes signalés par des élèves</dt>
                <dd>Publiés après modération.</dd>
              </div>
              )}
              {f.press > 0 && (
              <div>
                <dt>{formatNumber(f.press)} problèmes repris de la presse</dt>
                <dd>Tirés d’articles publiés, avec la source citée sur chaque fiche et le badge « Repris de la presse ».</dd>
              </div>
              )}
              {f.schools > 0 && (
              <div>
                <dt>{formatNumber(f.schools)} lycées concernés</dt>
                <dd>Lycées ayant au moins un problème publié.</dd>
              </div>
              )}
              {f.confirmations > 0 && (
              <div>
                <dt>{formatNumber(f.confirmations)} confirmations</dt>
                <dd>Élèves ayant indiqué « Je rencontre aussi ce problème ».</dd>
              </div>
              )}
              {f.mobs > 0 && (
              <div>
                <dt>{formatNumber(f.mobs)} lycées mobilisés en ce moment</dt>
                <dd>
                  Mobilisations (blocus, rassemblement…) signalées par des élèves et validées, ou reprises de la presse. Chacune
                  disparaît de la carte après 72 heures.
                </dd>
              </div>
              )}
            </dl>
          </>
        )}

        <h2>Comment lire ces chiffres</h2>
        <ul>
          <li>
            Ce sont des <strong>signalements</strong>, pas des constats vérifiés sur place. La modération écarte ce qui n’est pas
            sérieux ou vise une personne, mais ne peut pas se rendre dans les établissements.
          </li>
          <li>
            Le site ne <strong>classe</strong> pas les lycées : un lycée avec beaucoup de signalements peut simplement avoir des
            élèves plus nombreux à utiliser le site.
          </li>
          <li>Les problèmes résolus restent visibles comme tels, pour garder la trace des améliorations.</li>
        </ul>

        <h2>Qui est derrière</h2>
        <p>
          Signal Lycées est un projet personnel et bénévole de Kevin Pidoff. Il n’est lié à aucun syndicat, parti, établissement ni
          au ministère, n’affiche aucune publicité et ne revend aucune donnée. Le code est libre (licence AGPL-3.0) et public sur{" "}
          <a href="https://github.com/kpidoff10/signal-lycees" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          .
        </p>
        <p>
          Pour en savoir plus sur le fonctionnement : <Link href="/comment-ca-marche">Comment ça marche</Link> et{" "}
          <Link href="/regles">Règles de publication</Link>.
        </p>

        <h2>Visuels</h2>
        <p>
          Tu peux reprendre librement le <a href="/opengraph-image">visuel de présentation</a> (1200 × 630) et le{" "}
          <a href="/icon.svg">logo</a>, ainsi que des captures d’écran du site. Merci de citer « Signal Lycées
          (signal-lycees.fr) ».
        </p>
      </div>
    </>
  );
}
