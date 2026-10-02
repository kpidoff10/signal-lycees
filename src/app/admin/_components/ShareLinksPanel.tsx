"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Link {
  key: string;
  label: string;
  hint: string;
  visits: number;
}

/** Liens de partage suivis, à copier selon le canal, avec les arrivées des 30 derniers jours. */
export function ShareLinksPanel({ links, siteUrl }: { links: Link[]; siteUrl: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const base = siteUrl.replace(/\/$/, "");
  const shareable = links.filter((l) => l.key !== "affiche");
  const poster = links.find((l) => l.key === "affiche");

  return (
    <section className="adm-card" aria-labelledby="links-h">
      <h2 id="links-h" className="adm-h2">
        Liens de partage
      </h2>
      <p className="m-0 mb-4 adm-small adm-muted">
        Utilise le lien qui correspond à l’endroit où tu le publies : les visiteurs arrivés par ce lien apparaissent sous ce nom
        dans la provenance. Le marqueur est retiré de l’adresse dès l’arrivée. Arrivées comptées sur 30 jours, une par visiteur et
        par jour.
      </p>
      <ul className="adm-list">
        {shareable.map((l) => {
          const url = `${base}/?src=${l.key}`;
          return (
            <li key={l.key} className="adm-row grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
              <span className="min-w-0">
                <span className="adm-row-title block">{l.label.replace(/^Lien · /, "")}</span>
                <span className="adm-small adm-muted block">{l.hint}</span>
                <code className="adm-mono adm-small block overflow-hidden text-ellipsis whitespace-nowrap">{url}</code>
              </span>
              <span className="flex items-center gap-3">
                <span className="adm-small whitespace-nowrap">
                  <strong>{l.visits.toLocaleString("fr-FR")}</strong> arrivée{l.visits > 1 ? "s" : ""}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={copied === l.key ? "check" : "link"}
                  aria-label={`Copier le lien ${l.label}`}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(url);
                      setCopied(l.key);
                      setTimeout(() => setCopied((c) => (c === l.key ? null : c)), 2000);
                    } catch {
                      /* presse-papiers indisponible */
                    }
                  }}
                >
                  {copied === l.key ? "Copié" : "Copier"}
                </Button>
              </span>
            </li>
          );
        })}
      </ul>
      {poster && (
        <p className="m-0 mt-4 adm-small adm-muted">
          Affiches : {poster.visits.toLocaleString("fr-FR")} arrivée{poster.visits > 1 ? "s" : ""} par QR code sur 30 jours (lien
          ajouté automatiquement).
        </p>
      )}
    </section>
  );
}
