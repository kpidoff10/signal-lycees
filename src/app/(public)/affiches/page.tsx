import type { Metadata } from "next";
import Link from "next/link";
import { InfoHeader } from "../(info)/_components/InfoHeader";
import "../(info)/prose.css";
import { AffichePicker } from "./AffichePicker";

export const metadata: Metadata = {
  title: "Affiches à imprimer",
  description:
    "Choisis ton lycée : une affiche et des flyers avec le QR code de sa fiche se créent tout seuls, prêts à imprimer. Gratuit, sans compte.",
};

export default function AffichesPage() {
  return (
    <div className="container-page">
      <div className="sl-info">
        <InfoHeader
          eyebrow="Faire connaître le site"
          title="Affiches à imprimer"
          lead="Choisis ton lycée : une affiche et des flyers avec le QR code de sa fiche se créent tout seuls. Tu n’as plus qu’à imprimer."
        />

        <div className="grid gap-8">
          <AffichePicker />

          <div className="sl-prose">
            <h2>Où les afficher ?</h2>
            <p>
              Dans ton lycée, les élèves ont le droit d’afficher sur les <strong>panneaux réservés aux lycéens</strong>, en
              informant d’abord la direction : c’est la règle prévue par le Code de l’éducation. Les élus du CVL et les délégués
              peuvent t’aider. Les flyers, eux, se donnent de la main à la main entre élèves.
            </p>
            <p>
              Le QR code ouvre la fiche de ton lycée sur Signal Lycées : on y voit les problèmes déjà signalés et on peut en
              signaler un, anonymement. Voir <Link href="/comment-ca-marche">comment ça marche</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
