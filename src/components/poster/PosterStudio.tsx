"use client";

import { useState, type ReactNode } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";

type Format = "a4" | "flyers";

/** Choix du format et impression ; les deux feuilles sont déjà rendues par le serveur. */
export function PosterStudio({ a4, flyers }: { a4: ReactNode; flyers: ReactNode }) {
  const [format, setFormat] = useState<Format>("a4");
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Format"
          value={format}
          onChange={setFormat}
          options={[
            { value: "a4", label: "Affiche A4" },
            { value: "flyers", label: "4 flyers A6" },
          ]}
        />
        <Button icon="print" onClick={() => window.print()}>
          Imprimer ou enregistrer en PDF
        </Button>
      </div>
      <p className="text-[14px] leading-5 text-ink-muted">
        {format === "a4"
          ? "Une affiche sur une feuille A4."
          : "Quatre flyers sur une feuille A4, à découper le long des pointillés."}{" "}
        À l’impression, choisis le format A4, sans marges ou « taille réelle ».
      </p>
      <div hidden={format !== "a4"}>{a4}</div>
      <div hidden={format !== "flyers"}>{flyers}</div>
    </div>
  );
}
