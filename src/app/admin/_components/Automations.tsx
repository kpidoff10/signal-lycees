// Les deux automatisations (recherche des mobilisations, revue de presse) : dernier passage et bouton « Lancer ».
import Link from "next/link";
import type { ImportRun } from "@/generated/prisma/client";
import { Icon } from "@/components/ui/Icon";
import { runPressAction, runResearchAction } from "../imports/actions";
import { ActionForm } from "./ActionForm";
import { formatAgo, Submit } from "./ui";

type Stats = Record<string, number>;

function RunStatus({ run }: { run: ImportRun | null }) {
  if (!run) return <span className="adm-run-status">Jamais lancée</span>;
  const tone = run.status === "OK" ? "ok" : run.status === "ERROR" ? "error" : "running";
  const label = run.status === "OK" ? "Réussie" : run.status === "ERROR" ? "Échec" : "En cours";
  return (
    <span className={`adm-run-status is-${tone}`}>
      <span className="adm-run-dot" aria-hidden="true" />
      {label} · {formatAgo(run.startedAt)}
    </span>
  );
}

export function Automations({ research, press, historyLink = true }: { research: ImportRun | null; press: ImportRun | null; historyLink?: boolean }) {
  const rs = (research?.stats ?? {}) as Stats;
  const ps = (press?.stats ?? {}) as Stats;
  return (
    <div className="adm-autos">
      <article className="adm-auto">
        <header className="adm-auto-head">
          <span className="adm-auto-icon" aria-hidden="true">
            <Icon name="search" size={18} />
          </span>
          <span>
            <b>Recherche des mobilisations</b>
            <span className="adm-small adm-muted">Perplexity, région par région · 8 h 15 et 14 h 15</span>
          </span>
        </header>
        <RunStatus run={research} />
        {research?.status === "OK" && (
          <p className="adm-auto-figures">
            {"verifiedPublished" in rs ? (
              <>
                <b>{rs.created ?? 0}</b> trouvé(s) : {rs.verifiedPublished} publié(s), {rs.verifiedRejected} écarté(s), {rs.verifiedPending} à valider
              </>
            ) : (
              <>
                <b>{rs.created ?? 0}</b> à valider
              </>
            )}{" "}
            · {rs.alreadyKnown ?? 0} déjà sur la carte · {rs.unmatched ?? 0} introuvable(s)
          </p>
        )}
        <ActionForm action={runResearchAction} className="adm-auto-action">
          <Submit variant="secondary">Lancer maintenant</Submit>
        </ActionForm>
      </article>
      <article className="adm-auto">
        <header className="adm-auto-head">
          <span className="adm-auto-icon" aria-hidden="true">
            <Icon name="news" size={18} />
          </span>
          <span>
            <b>Revue de presse</b>
            <span className="adm-small adm-muted">Flux d’actualités, Jev et second avis · toutes les heures environ</span>
          </span>
        </header>
        <RunStatus run={press} />
        {press?.status === "OK" && (
          <p className="adm-auto-figures">
            <b>{ps.added ?? 0}</b> nouvel(s) article(s) · {ps.published ?? 0} publié(s) · {(ps.mobilizations ?? 0) + (ps.listSchools ?? 0)} mobilisation(s)
          </p>
        )}
        <ActionForm action={runPressAction} className="adm-auto-action">
          <Submit variant="secondary">Lancer maintenant</Submit>
        </ActionForm>
      </article>
      {historyLink && (
        <Link href="/admin/imports" className="adm-auto-link link adm-small">
          Tout l’historique des imports →
        </Link>
      )}
    </div>
  );
}
