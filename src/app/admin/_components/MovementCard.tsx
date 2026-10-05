// Bloc « Mouvement lycéen » du tableau de bord : lycées mobilisés aujourd'hui, à valider, et les 10 derniers jours.
import Link from "next/link";
import { formatNumber } from "@/lib/format";

const shortDay = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

export function MovementCard({ days, activeNow, pending }: { days: { day: string; schools: number }[]; activeNow: number; pending: number }) {
  const last = days.slice(-10);
  const today = last.at(-1);
  const max = Math.max(1, ...last.map((d) => d.schools));
  return (
    <section className="adm-card adm-move" aria-labelledby="move-h">
      <div className="adm-move-head">
        <h2 id="move-h" className="adm-h2">
          Mouvement lycéen
        </h2>
        <Link href="/statistiques" className="link adm-small">
          Statistiques publiques
        </Link>
      </div>
      <div className="adm-move-figures">
        <span>
          <b>{formatNumber(today?.schools ?? 0)}</b>
          <span className="adm-small adm-muted">lycées mobilisés aujourd’hui</span>
        </span>
        <span>
          <b>{formatNumber(activeNow)}</b>
          <span className="adm-small adm-muted">📣 sur la carte</span>
        </span>
        <Link href="/admin/mobilisations" className={pending ? "is-todo" : undefined}>
          <b>{formatNumber(pending)}</b>
          <span className="adm-small adm-muted">à valider</span>
        </Link>
      </div>
      <div className="adm-move-bars" role="img" aria-label={`Lycées mobilisés par jour : ${last.map((d) => `${shortDay(d.day)} ${d.schools}`).join(", ")}`}>
        {last.map((d) => (
          <span key={d.day} className="adm-move-col" title={`${shortDay(d.day)} : ${d.schools} lycée(s)`}>
            <span className="adm-move-bar" style={{ height: `${Math.max(d.schools ? 4 : 0, (100 * d.schools) / max)}%` }} />
            <span className="adm-move-day">{shortDay(d.day).replace(/\.$/, "")}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
