import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/lib/env";
import { requireAdmin } from "@/server/admin/auth";
import { listMobilizations } from "@/server/admin/mobilizations";
import { ActionForm } from "../_components/ActionForm";
import { Badge, Empty, formatDate, formatDateTime, PageHeader, Submit } from "../_components/ui";
import { addAction, approveAction, endAction, rejectAction } from "./actions";

export const metadata: Metadata = { title: "Mobilisations" };
export const dynamic = "force-dynamic";

const ORIGIN: Record<string, string> = { STUDENT: "Élève", PRESS: "Presse", ADMIN: "Modération" };

export default async function MobilizationsPage() {
  await requireAdmin();
  const { pending, active, recent } = await listMobilizations();
  const ttl = env().MOBILIZATION_TTL_HOURS;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid gap-8">
      <PageHeader
        title="Mobilisations"
        sub={`Affichées sur la carte avec 📣 pendant ${ttl} h après leur date, puis retirées automatiquement. Jamais d'heure ni de lieu de rendez-vous.`}
      />

      <section>
        <h2 className="adm-h2">À valider ({pending.length})</h2>
        {pending.length === 0 ? (
          <Empty>Aucune mobilisation signalée par des élèves en attente.</Empty>
        ) : (
          <ul className="adm-list">
            {pending.map((m) => (
              <li key={m.id} className="adm-row" style={{ gap: "var(--space-2)" }}>
                <span className="adm-meta">
                  <Badge tone="signal">Élève</Badge>
                  <span>
                    {m.school.name} ({m.school.city})
                  </span>
                  <span>le {formatDate(m.happenedOn)}</span>
                  <span className="adm-muted">reçue {formatDateTime(m.createdAt)}</span>
                </span>
                <ActionForm action={approveAction} className="adm-form">
                  <input type="hidden" name="id" value={m.id} />
                  <label className="adm-label">
                    Motifs (corrige-les si besoin : rien qui vise une personne)
                    <textarea name="reasons" className="field" maxLength={200} defaultValue={m.reasons ?? ""} />
                  </label>
                  <div className="adm-actions">
                    <Submit>Publier</Submit>
                  </div>
                </ActionForm>
                <ActionForm action={rejectAction} className="adm-form">
                  <input type="hidden" name="id" value={m.id} />
                  <Submit variant="secondary">Refuser</Submit>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="adm-h2">En cours sur la carte ({active.length})</h2>
        {active.length === 0 ? (
          <Empty>Aucune mobilisation affichée.</Empty>
        ) : (
          <ul className="adm-list">
            {active.map((m) => (
              <li key={m.id} className="adm-row" style={{ gap: "var(--space-2)" }}>
                <span className="adm-meta">
                  <Badge>{ORIGIN[m.origin]}</Badge>
                  <Link href={`/lycee/${m.school.slug}`} className="link">
                    {m.school.name} ({m.school.city})
                  </Link>
                  <span>le {formatDate(m.happenedOn)}</span>
                  <span className="adm-muted">jusqu’au {formatDateTime(m.expiresAt)}</span>
                  {m.importBatch && <span className="adm-mono">{m.importBatch}</span>}
                </span>
                {m.reasons && <p className="m-0 user-text adm-small">Motifs : {m.reasons}</p>}
                {m.sourceUrl && (
                  <a href={m.sourceUrl} className="link adm-small" target="_blank" rel="noopener noreferrer">
                    {m.sourceName ?? "Source"}
                  </a>
                )}
                <ActionForm action={endAction} className="adm-form">
                  <input type="hidden" name="id" value={m.id} />
                  <Submit variant="secondary">Retirer de la carte</Submit>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="adm-h2">Ajouter une mobilisation</h2>
        <ActionForm action={addAction} className="adm-form adm-card">
          <label className="adm-label">
            Identifiant du lycée (fin de l’URL de sa fiche, ex. lycee-victor-hugo-poitiers)
            <input name="schoolSlug" className="field" required maxLength={120} />
          </label>
          <label className="adm-label">
            Date
            <input name="happenedOn" type="date" className="field" required defaultValue={today} max={today} />
          </label>
          <label className="adm-label">
            Motifs (facultatif)
            <textarea name="reasons" className="field" maxLength={200} />
          </label>
          <label className="adm-label">
            Source : nom du média (facultatif)
            <input name="sourceName" className="field" maxLength={80} />
          </label>
          <label className="adm-label">
            Source : lien de l’article (facultatif)
            <input name="sourceUrl" type="url" className="field" maxLength={500} />
          </label>
          <div className="adm-actions">
            <Submit>Ajouter</Submit>
          </div>
        </ActionForm>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="adm-h2">Terminées ou refusées récemment</h2>
          <ul className="adm-list">
            {recent.map((m) => (
              <li key={m.id} className="adm-row">
                <span className="adm-meta">
                  <Badge tone="outline">{m.status === "REJECTED" ? "Refusée" : "Expirée"}</Badge>
                  <span>
                    {m.school.name} ({m.school.city})
                  </span>
                  <span>le {formatDate(m.happenedOn)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
