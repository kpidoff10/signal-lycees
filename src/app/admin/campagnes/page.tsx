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
    <div className="grid gap-4">
      <PageHeader
        title="Campagnes"
        sub="Chaque mail envoyé porte ses propres liens : on voit qui est venu sur le site, quand et sur quelle page. Pas de suivi d’ouverture (aucun pixel)."
      />
      {campaigns.length === 0 && <Empty>Aucun contact enregistré pour l’instant.</Empty>}
      {campaigns.map((c, i) => (
        // La campagne la plus récente est ouverte, les autres repliées.
        <details key={c.campaign} className="adm-card adm-fold" open={i === 0}>
          <summary>
            <span className="adm-fold-title">
              <span className="adm-h2">{c.campaign}</span>
              <span className="adm-small adm-muted">
                {c.visited} venu(s) sur {c.sent} envoyé(s)
              </span>
            </span>
          </summary>
          <div className="adm-fold-body grid gap-2">
            {c.contacts.map((ct) => (
              <details key={ct.id} className="adm-fold adm-contact">
                <summary>
                  <span className="adm-meta">
                    {ct.visits.length ? <Badge tone="ok">Venu · {ct.visits.length}</Badge> : <Badge tone="outline">Pas encore</Badge>}
                    <strong>{ct.label}</strong>
                    {ct.visits.length > 0 && <span className="adm-small adm-muted">dernière visite {formatDateTime(ct.visits.at(-1)!.at)}</span>}
                  </span>
                </summary>
                <div className="adm-fold-body grid gap-2 adm-small">
                  <span className="adm-meta">
                    <span>{ct.email}</span>
                    <span className="adm-muted">{ct.sentAt ? `envoyé ${formatDateTime(ct.sentAt)}` : "non envoyé"}</span>
                    <span className="adm-mono">?src={ct.code}</span>
                  </span>
                  {ct.visits.length === 0 ? (
                    <p className="m-0 adm-muted">Aucune visite par ses liens pour l’instant.</p>
                  ) : (
                    <ul className="adm-list">
                      {ct.visits.map((v, j) => (
                        <li key={j} className="adm-meta">
                          <span className="adm-muted">{formatDateTime(v.at)}</span>
                          <span className="adm-mono">{v.path}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
