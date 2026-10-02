"use client";

import dynamic from "next/dynamic";

// MapLibre ne s'exécute que dans le navigateur : chargement différé, sans rendu serveur.
const NationalMap = dynamic(() => import("./NationalMap"), {
  ssr: false,
  loading: () => (
    <div className="sl-nm-stage grid place-items-center text-sm text-ink-muted" aria-busy="true">
      Chargement de la carte…
    </div>
  ),
});

export function MapSection() {
  return <NationalMap />;
}
