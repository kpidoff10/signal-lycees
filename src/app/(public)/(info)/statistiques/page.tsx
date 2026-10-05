import type { Metadata } from "next";
import Link from "next/link";
import { CategoryBars, DailyBars } from "@/components/stats/Charts";
import { StatCounters } from "@/components/ui/Stats";
import { PRESS_EMAIL } from "@/lib/contact";
import { formatNumber, plural } from "@/lib/format";
import { getStatistics } from "@/server/statistics";
import { InfoHeader } from "../_components/InfoHeader";

export const revalidate = 1800;

export const metadata: Metadata = {
  alternates: { canonical: "/statistiques" },
  title: "Statistiques",
  description:
    "Les chiffres de Signal Lycées, mis à jour automatiquement : lycées mobilisés jour par jour, problèmes par thème et par région, sources des données. Téléchargeables en CSV.",
};

const fmtDateTime = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(d);

export default async function StatistiquesPage() {
  const s = await getStatistics().catch(() => null);

  return (
    <>
      <InfoHeader
        eyebrow="Données ouvertes"
        title="Statistiques"
        lead="Les chiffres du site, mis à jour automatiquement. Libres de reprise avec la mention « Source : Signal Lycées »."
      />

      <div className="sl-prose">
        {!s ? (
          <p>Les statistiques sont momentanément indisponibles. Réessaie dans quelques minutes.</p>
        ) : (
          <>
            <p className="m-0 text-[14px] text-ink-muted">Mis à jour le {fmtDateTime(s.updatedAt)}.</p>

            <StatCounters
              compact
              items={[
                { value: s.national.activeMobilizations, label: plural(s.national.activeMobilizations, "lycée mobilisé en ce moment", "lycées mobilisés en ce moment"), tone: "mobilization" },
                { value: s.national.activeIssues, label: plural(s.national.activeIssues, "problème actif", "problèmes actifs"), tone: "signal" },
                { value: s.national.schoolsConcerned, label: plural(s.national.schoolsConcerned, "lycée concerné", "lycées concernés") },
                { value: s.national.confirmations, label: plural(s.national.confirmations, "confirmation d’élève", "confirmations d’élèves") },
              ]}
            />

            <h2>Le mouvement lycéen, jour par jour</h2>
            <p>
              Nombre de lycées bloqués, fermés, passés en cours à distance ou lieu d’une mobilisation, chaque jour depuis le 30 septembre.
              Chaque lycée est nommé dans un article de presse (cité sur sa fiche) ou signalé par un élève puis vérifié.
            </p>
            <DailyBars data={s.mobilizationsByDay} label="Lycées mobilisés par jour depuis le 30 septembre" />
            <p className="text-[14px] text-ink-muted">
              Les week-ends apparaissent à zéro : pas de cours, donc pas de blocus. Un chiffre plancher : seuls les lycées précisément nommés
              sont comptés. Quand un rectorat annonce « tous les lycées d’une ville
              fermés » sans les nommer, ils ne figurent pas ici.{" "}
              <a href="/api/statistiques/mobilisations" download>Télécharger (CSV)</a>
            </p>

            <h2>Les problèmes par thème</h2>
            <p>Problèmes actifs (publiés et non résolus), par catégorie.</p>
            <CategoryBars data={s.byCategory} label="Problèmes actifs par thème" />
            <p className="text-[14px] text-ink-muted">
              <a href="/api/statistiques/themes" download>Télécharger (CSV)</a>
            </p>

            <h2>Par région</h2>
            <p>Par ordre alphabétique : Signal Lycées ne classe ni les lycées ni les territoires.</p>
            <div className="sl-stat-table-wrap">
              <table className="sl-stat-table">
                <thead>
                  <tr>
                    <th scope="col">Région</th>
                    <th scope="col">Problèmes actifs</th>
                    <th scope="col">Lycées mobilisés en ce moment</th>
                    <th scope="col">Lycées mobilisés depuis le 30/09</th>
                  </tr>
                </thead>
                <tbody>
                  {s.byRegion.map((r) => (
                    <tr key={r.region}>
                      <th scope="row" className="font-semibold">
                        {r.region}
                      </th>
                      <td>{formatNumber(r.activeIssues)}</td>
                      <td>{formatNumber(r.mobilizedNow)}</td>
                      <td>{formatNumber(r.mobilizedSinceStart)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[14px] text-ink-muted">
              Le détail par département et par commune est sur la page <Link href="/lycees">Lycées</Link>.{" "}
              <a href="/api/statistiques/regions" download>Télécharger (CSV)</a>
            </p>

            <h2>D’où viennent les données</h2>
            <StatCounters
              compact
              items={[
                { value: s.bySource.student, label: plural(s.bySource.student, "problème signalé par un élève", "problèmes signalés par des élèves"), tone: "signal" },
                { value: s.bySource.press, label: plural(s.bySource.press, "problème repris de la presse", "problèmes repris de la presse") },
              ]}
            />
            <p>
              Les signalements d’élèves sont anonymes et vérifiés avant publication : personne n’y est nommé. Les problèmes repris de la presse
              portent toujours la mention et le lien de leur source. Le site a ouvert début octobre 2026 : la part des élèves grandira à
              mesure qu’ils s’en emparent.
            </p>

            <h2>Méthode</h2>
            <ul>
              <li>
                <strong>Problème actif</strong> : publié, et ni résolu ni retiré. Avant de déposer, l’élève se voit proposer les problèmes
                proches déjà signalés dans son lycée, pour les confirmer plutôt que de créer un doublon.
              </li>
              <li>
                <strong>Lycée mobilisé</strong> : nommé ce jour-là dans un article de presse comme bloqué, fermé ou passé à distance à cause du
                mouvement, ou signalé par un élève puis validé. Une mobilisation reste affichée 72 h.
              </li>
              <li>
                Les chiffres sont recalculés toutes les 30 minutes. Pour une question ou des données plus fines :{" "}
                <a href={`mailto:${PRESS_EMAIL}`}>{PRESS_EMAIL}</a>, ou l’<Link href="/presse">espace presse</Link>.
              </li>
            </ul>
          </>
        )}
      </div>
    </>
  );
}
