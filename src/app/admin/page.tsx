import Link from "next/link";
import { requireAdmin } from "@/server/admin/auth";
import { dashboardCounts } from "@/server/admin/dashboard";
import { trafficOverview } from "@/server/admin/traffic";
import { ShareLinksPanel } from "./_components/ShareLinksPanel";
import { publicEnv } from "@/lib/env";
import { TrafficPanel } from "./_components/TrafficPanel";
import { ActionForm } from "./_components/ActionForm";
import { PageHeader, Submit } from "./_components/ui";
import { freezeAction, secondOpinionAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const [c, traffic] = await Promise.all([dashboardCounts(), trafficOverview()]);

  const stats = [
    { label: "dans la file de modération", value: c.queue, href: "/admin/moderation", hot: c.queue > 0 },
    { label: "urgents", value: c.urgent, href: "/admin/moderation", hot: c.urgent > 0 },
    { label: "publiés signalés par 👎", value: c.flagged, href: "/admin/moderation", hot: false },
    { label: "signalements de contenu ouverts", value: c.openReports, href: "/admin/moderation", hot: false },
    { label: "demandes de confidentialité à traiter", value: c.pendingRequests, href: "/admin/requests", hot: c.pendingRequests > 0 },
  ];

  return (
    <div className="adm-stack">
      <PageHeader title="Tableau de bord" />

      <div className="adm-stats">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`adm-stat${s.hot ? " is-hot" : ""}`}>
            <span className="adm-stat-value">{s.value.toLocaleString("fr-FR")}</span>
            <span className="adm-stat-label">{s.label}</span>
          </Link>
        ))}
      </div>

      {c.limiter === "memory" && process.env.NODE_ENV === "production" && (
        <p className="adm-msg adm-msg-error">
          Limitation anti-abus non partagée (Upstash non configuré) : les limites de dépôts, votes et connexions sont faciles à
          contourner.
        </p>
      )}

      <TrafficPanel t={traffic} />

      <ShareLinksPanel links={traffic.links} posterVisits={traffic.posterVisits} siteUrl={publicEnv.siteUrl} />

      <section className={`adm-card${c.frozen ? " adm-urgent" : ""}`} aria-labelledby="freeze-h">
        <h2 id="freeze-h" className="adm-h2">
          Interrupteur d&apos;urgence
        </h2>
        <p className="m-0 mb-3 text-[15px] leading-[22px]">
          {c.frozen ? (
            <>
              <b>Publication automatique suspendue.</b> Chaque nouveau signalement part en revue manuelle.
            </>
          ) : (
            <>
              Publication automatique <b>active</b> : les signalements sans risque détecté sont publiés directement.
            </>
          )}
        </p>
        {c.frozenByEnv ? (
          <p className="adm-msg adm-msg-error">
            Suspension forcée par la variable d&apos;environnement MODERATION_FREEZE : à modifier dans la configuration du serveur.
          </p>
        ) : c.frozen ? (
          <ActionForm action={freezeAction} confirmMessage="Réactiver la publication automatique ?">
            <input type="hidden" name="frozen" value="0" />
            <div>
              <Submit variant="secondary">Réactiver la publication automatique</Submit>
            </div>
          </ActionForm>
        ) : (
          <ActionForm action={freezeAction} confirmMessage="Suspendre la publication automatique ? Tout passera en revue manuelle.">
            <input type="hidden" name="frozen" value="1" />
            <div>
              <Submit>Suspendre la publication automatique</Submit>
            </div>
          </ActionForm>
        )}
      </section>

      <section className="adm-card" aria-labelledby="second-h">
        <h2 id="second-h" className="adm-h2">
          Second avis GPT
        </h2>
        <p className="m-0 mb-3 text-[15px] leading-[22px]">
          Quand Jev hésite, GPT-5 mini départage. Désactivé, tout ce dont Jev doute arrive dans ta file de modération.
        </p>
        <ul className="adm-list">
          {(
            [
              ["issues", "Signalements des élèves", "publie, reformule légèrement ou te laisse la décision"],
              ["press", "Revue de presse", "publie ou écarte les articles"],
            ] as const
          ).map(([scope, label, does]) => {
            const on = c.secondOpinion[scope];
            return (
              <li key={scope} className="adm-row">
                <span className="adm-meta">
                  <b>{label}</b>
                  <span>{on ? `actif : ${does}` : "désactivé : revue humaine"}</span>
                </span>
                <ActionForm action={secondOpinionAction}>
                  <input type="hidden" name="scope" value={scope} />
                  <input type="hidden" name="enabled" value={on ? "0" : "1"} />
                  <div>
                    <Submit variant={on ? "secondary" : "primary"}>{on ? "Désactiver" : "Réactiver"}</Submit>
                  </div>
                </ActionForm>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="m-0 adm-small adm-muted">
        Limitation anti-abus : {c.limiter === "upstash" ? "partagée (Upstash) ✓" : "en mémoire (développement)"}
      </p>

      <section className="adm-card" aria-labelledby="links-h">
        <h2 id="links-h" className="adm-h2">
          Sections
        </h2>
        <ul className="adm-list">
          {(
            [
            ["/admin/moderation", "File de modération", "Publier, modifier, refuser ; problèmes publiés signalés."],
            ["/admin/issues", "Signalements", "Recherche, statut public, dépublication, suppression."],
            ["/admin/schools", "Lycées", "Nom, adresse, coordonnées, ouverture."],
            ["/admin/users", "Identités anonymes", "Bannir ou débannir un appareil."],
            ["/admin/requests", "Demandes", "Suppressions et contacts (RGPD, DSA)."],
            ["/admin/logs", "Journal", "Toutes les actions d'administration."],
            ] as const
          ).map(([href, title, sub]) => (
            <li key={href}>
              <Link href={href} className="adm-row">
                <span className="adm-row-title">{title}</span>
                <span className="adm-small adm-muted">{sub}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
