import Link from "next/link";
import { Icon } from "./Icon";

// Les deux promesses du site, répétées partout où l'élève participe :
// c'est anonyme, et c'est modéré.
const ITEMS = [
  {
    icon: "lock" as const,
    title: "Anonyme",
    text: "Pas de compte, pas d’e-mail, pas de nom. Personne ne peut savoir qui a signalé.",
  },
  {
    icon: "shieldCheck" as const,
    title: "Modéré",
    text: "Chaque signalement est vérifié avant publication. Rien ne peut viser un élève ou un adulte.",
  },
];

/** Version complète : deux cartes côte à côte. */
export function TrustNote({ className = "" }: { className?: string }) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      {ITEMS.map((i) => (
        <div key={i.title} className="flex gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-resolved-soft text-resolved" aria-hidden="true">
            <Icon name={i.icon} size={18} />
          </span>
          <span className="text-[14px] leading-5">
            <b className="block text-[15px]">{i.title}</b>
            <span className="text-ink-muted">{i.text}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Version courte : une ligne, pour les endroits serrés. */
export function TrustLine({ className = "", link = true }: { className?: string; link?: boolean }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-semibold text-ink-muted ${className}`}>
      <span className="inline-flex items-center gap-1.5">
        <Icon name="lock" size={15} className="text-resolved" />
        Anonyme, sans compte ni e-mail
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Icon name="shieldCheck" size={15} className="text-resolved" />
        Vérifié avant publication
      </span>
      {link && (
        <Link href="/comment-ca-marche" className="link font-semibold">
          Comment ça marche
        </Link>
      )}
    </p>
  );
}
