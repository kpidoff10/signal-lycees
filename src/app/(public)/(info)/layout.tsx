import type { ReactNode } from "react";
import "./prose.css";

export default function InfoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container-page">
      <article className="sl-info">{children}</article>
    </div>
  );
}
