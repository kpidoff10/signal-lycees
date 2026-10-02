import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  updated?: string;
}

/** En-tête commun des pages d'information. */
export function InfoHeader({ eyebrow, title, lead, updated }: Props) {
  return (
    <header className="sl-info-head">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="sl-info-title">{title}</h1>
      {lead && <p className="sl-info-lead">{lead}</p>}
      {updated && <p className="sl-info-updated">Dernière mise à jour : {updated}</p>}
    </header>
  );
}

/** Information à compléter par l'éditeur avant la mise en ligne : volontairement très visible. */
export function Todo({ children }: { children: ReactNode }) {
  return <mark className="sl-todo">[À COMPLÉTER : {children}]</mark>;
}
