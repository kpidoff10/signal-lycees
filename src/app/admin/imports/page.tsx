import type { Metadata } from "next";
import type { ImportRun } from "@/generated/prisma/client";
import { requireAdmin } from "@/server/admin/auth";
import { lastRuns, listImportRuns } from "@/server/admin/imports";
import { Automations } from "../_components/Automations";
import { Badge, Empty, formatAgo, formatDateTime, formatDuration, PageHeader } from "../_components/ui";

export const metadata: Metadata = { title: "Imports" };
export const dynamic = "force-dynamic";

const KIND = { RESEARCH: "Recherche", PRESS: "Revue de presse", FILE: "Fichier" } as const;
const TRIGGER = { AUTO: "Automatique", MANUAL: "Lancé à la main", CLI: "Ligne de commande" } as const;

// Libellés des compteurs, dans l'ordre d'affichage.
const STAT_LABELS: Record<string, string> = {
  created: "créé(s)",
  requests: "requête(s)",
  failedRequests: "requête(s) en échec",
  cited: "lycée(s) cité(s)",
  alreadyKnown: "déjà sur la carte",
  unmatched: "introuvable(s)",
  fetched: "article(s) lu(s)",
  added: "nouvel(s) article(s)",
  published: "publié(s)",
  pending: "à vérifier",
  rejected: "écarté(s)",
  mobilizations: "mobilisation(s) tirée(s) des titres",
  listsRead: "liste(s) lue(s)",
  listSchools: "lycée(s) tiré(s) des listes",
  inFile: "dans le fichier",
  expired: "déjà expiré(s)",
  missing: "absent(s) de l'annuaire",
};

/** Le chiffre qui résume le passage. */
function headline(run: ImportRun): string {
  const s = (run.stats ?? {}) as Record<string, number>;
  if (run.status === "RUNNING") return "en cours…";
  if (run.status === "ERROR") return "échec";
  if (run.kind === "PRESS") return `${s.added ?? 0} article(s)`;
  return `${s.created ?? 0} créé(s)`;
}

export default async function ImportsPage() {
  await requireAdmin();
  const [runs, last] = await Promise.all([listImportRuns(), lastRuns()]);

  return (
    <div className="grid gap-6">
      <PageHeader title="Imports" sub="Ce que le site récupère tout seul (ou quand tu le lui demandes), et l’historique de chaque passage." />
      <Automations research={last.research} press={last.press} historyLink={false} />

      <section className="grid gap-2">
        <h2 className="adm-h2">Historique</h2>
        {runs.length === 0 && <Empty>Aucun passage enregistré pour l’instant.</Empty>}
        {runs.map((r) => {
          const stats = Object.entries((r.stats ?? {}) as Record<string, number>).filter(([k]) => k in STAT_LABELS);
          const details = (r.details ?? {}) as { unmatched?: { name: string; city: string; url: string }[]; missing?: string[]; batch?: string };
          return (
            <details key={r.id} className="adm-fold adm-contact adm-run">
              <summary>
                <span className="adm-meta">
                  <span className={`adm-run-status is-${r.status === "OK" ? "ok" : r.status === "ERROR" ? "error" : "running"}`}>
                    <span className="adm-run-dot" aria-hidden="true" />
                  </span>
                  <Badge tone="outline">{KIND[r.kind]}</Badge>
                  <strong>{r.label}</strong>
                  <span className="adm-run-headline">{headline(r)}</span>
                  <span className="adm-small adm-muted">
                    {formatAgo(r.startedAt)} · {TRIGGER[r.trigger].toLowerCase()}
                  </span>
                </span>
              </summary>
              <div className="adm-fold-body grid gap-3 adm-small">
                <p className="m-0 adm-muted">
                  Lancé le {formatDateTime(r.startedAt)} · durée {formatDuration(r.startedAt, r.finishedAt)}
                  {details.batch && <> · lot <span className="adm-mono">{details.batch}</span></>}
                </p>
                {r.error && <p className="m-0 adm-msg adm-msg-error">{r.error}</p>}
                {stats.length > 0 && (
                  <ul className="adm-chips">
                    {Object.keys(STAT_LABELS)
                      .filter((k) => stats.some(([s]) => s === k))
                      .map((k) => (
                        <li key={k}>
                          <b>{stats.find(([s]) => s === k)![1]}</b> {STAT_LABELS[k]}
                        </li>
                      ))}
                  </ul>
                )}
                {!!details.unmatched?.length && (
                  <div>
                    <p className="m-0 font-semibold">Cités mais introuvables dans l’annuaire (à ajouter à la main si besoin) :</p>
                    <ul className="adm-list mt-2">
                      {details.unmatched.map((u, i) => (
                        <li key={i}>
                          {u.name} ({u.city}) ·{" "}
                          <a href={u.url} className="link" target="_blank" rel="noopener noreferrer">
                            article
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {!!details.missing?.length && <p className="m-0">Absents de l’annuaire : {details.missing.join(", ")}</p>}
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
