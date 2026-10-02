import { shortSchoolName } from "@/lib/school-name";

export interface PosterSchool {
  name: string;
  city: string;
}

/**
 * Affiche imprimable aux couleurs du site. Toutes les tailles sont en unités de
 * conteneur (cqw) : le même dessin remplit une page A4 ou un flyer A6, à l'écran
 * comme à l'impression.
 */
export function Poster({ school, qr, compact = false }: { school: PosterSchool; qr: string; compact?: boolean }) {
  const name = shortSchoolName(school.name);
  return (
    <div className={`poster ${compact ? "is-compact" : ""}`}>
      <div className="poster-dots" aria-hidden="true">
        <span style={{ top: "6%", right: "9%", width: "9%" }} />
        <span style={{ top: "3%", right: "26%", width: "4%" }} />
        <span style={{ top: "15%", right: "3%", width: "5%" }} />
      </div>

      <p className="poster-brand">
        <span className="poster-logo" aria-hidden="true" />
        Signal Lycées
      </p>

      <div className="poster-main">
        <p className="poster-city">{school.city}</p>
        <p className={`poster-school ${name.length > 32 ? "is-long" : ""}`}>{name}</p>
        <p className="poster-title">
          Ce qui se passe ici mérite d’être <span>entendu.</span>
        </p>
        {!compact && (
          <p className="poster-lead">
            Locaux, sanitaires, cantine, sécurité… Signale ce qui ne va pas, ou confirme ce que d’autres élèves ont déjà signalé.
          </p>
        )}
      </div>

      <div className="poster-scan">
        <div className="poster-qr" dangerouslySetInnerHTML={{ __html: qr }} />
        <div className="poster-scan-text">
          <p className="poster-scan-title">Scanne-moi</p>
          <p>{compact ? "pour signaler ou confirmer un problème." : "pour voir les problèmes signalés dans ton lycée, en confirmer ou en signaler un."}</p>
        </div>
      </div>

      <div className="poster-foot">
        <p className="poster-chips">
          <span>Anonyme</span>
          <span>Gratuit</span>
          <span>Modéré</span>
        </p>
        <p className="poster-small">
          {compact ? "Sans compte · signal-lycees.fr" : "Sans compte, sans e-mail. Aucun nom de personne n’est publié. Projet libre et indépendant · signal-lycees.fr"}
        </p>
      </div>
    </div>
  );
}
