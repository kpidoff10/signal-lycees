import type { Metadata } from "next";
import { requireAdmin } from "@/server/admin/auth";
import { listOutreach } from "@/server/admin/outreach";
import { Badge, Empty, formatDateTime, PageHeader } from "../_components/ui";

export const metadata: Metadata = { title: "Campagnes" };
export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  await requireAdmin();
  const campaigns = await listOutreach();

  return (
    <div className="grid gap-8">
      <PageHeader
        title="Campagnes"
        sub="Chaque mail envoyé porte ses propres liens : on voit qui est venu sur le site, quand et sur quelle page. Pas de suivi d’ouverture (aucun pixel)."
      />
      {campaigns.length === 0 && <Empty>Aucun contact enregistré pour l’instant.</Empty>}
      {campaigns.map((c) => (
        <section key={c.campaign}>
          <h2 className="adm-h2">
            {c.campaign} <span className="adm-small adm-muted">· {c.visited} venu(s) sur {c.sent} envoyé(s)</span>
          </h2>
          <ul className="adm-list">
            {c.contacts.map((ct) => {
              const pages = [...new Set(ct.visits.map((v) => v.path))];
              return (
                <li key={ct.id} className="adm-row" style={{ gap: "var(--space-2)" }}>
                  <span className="adm-meta">
                    {ct.visits.length ? <Badge tone="ok">Venu · {ct.visits.length}</Badge> : <Badge tone="outline">Pas encore</Badge>}
                    <strong>{ct.label}</strong>
                    <span className="adm-muted">{ct.email}</span>
                    <span className="adm-mono">{ct.code}</span>
                    <span className="adm-muted">{ct.sentAt ? `envoyé ${formatDateTime(ct.sentAt)}` : "non envoyé"}</span>
                  </span>
                  {ct.visits.length > 0 && (
                    <p className="m-0 adm-small">
                      Première visite {formatDateTime(ct.visits[0]!.at)}
                      {ct.visits.length > 1 && <>, dernière {formatDateTime(ct.visits.at(-1)!.at)}</>} · arrivé sur {pages.join(", ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
