import type { trafficOverview } from "@/server/admin/traffic";

type Overview = Awaited<ReturnType<typeof trafficOverview>>;

const fmt = (n: number) => n.toLocaleString("fr-FR");
const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/** Fréquentation : chiffres clés, visiteurs par jour (30 jours), pages et provenances (7 jours). */
export function TrafficPanel({ t }: { t: Overview }) {
  const max = Math.max(1, ...t.series.map((d) => d.visitors));
  const tiles = [
    { label: "visiteurs aujourd’hui", value: t.today.visitors, sub: `${fmt(t.today.views)} pages vues` },
    { label: "visiteurs hier", value: t.yesterday.visitors, sub: `${fmt(t.yesterday.views)} pages vues` },
    { label: "visites sur 7 jours", value: t.week.visitors, sub: `moyenne ${fmt(Math.round(t.week.visitors / 7))} / jour` },
    { label: "visites sur 30 jours", value: t.month.visitors, sub: `${fmt(t.month.views)} pages vues` },
  ];
  const maxPage = Math.max(1, ...t.pages.map((p) => p.views));
  const maxSource = Math.max(1, ...t.sources.map((s) => s.views));

  return (
    <section className="adm-card" aria-labelledby="traffic-h">
      <h2 id="traffic-h" className="adm-h2">
        Fréquentation
      </h2>
      <p className="m-0 mb-4 adm-small adm-muted">
        Sans cookie : un visiteur unique est compté une fois par jour (empreinte anonyme effacée le lendemain). Sur une période, les
        visites sont la somme des visiteurs uniques de chaque jour. Robots exclus.
      </p>

      <div className="adm-stats adm-stats-4">
        {tiles.map((s) => (
          <div key={s.label} className="adm-stat">
            <span className="adm-stat-value">{fmt(s.value)}</span>
            <span className="adm-stat-label">{s.label}</span>
            <span className="adm-small adm-muted">{s.sub}</span>
          </div>
        ))}
      </div>

      <h3 className="adm-h3" style={{ marginTop: "var(--space-6)" }}>
        Visiteurs uniques par jour (30 jours)
      </h3>
      <div className="adm-chart" role="img" aria-label={`Visiteurs uniques par jour sur 30 jours, maximum ${fmt(max)}`}>
        <span className="adm-chart-max adm-small adm-muted">{fmt(max)}</span>
        <div className="adm-chart-bars">
          {t.series.map((d) => (
            <span key={d.day} className="adm-col-hit" tabIndex={0}>
              <span className="adm-col" style={{ height: `${d.visitors ? Math.max(3, (d.visitors / max) * 100) : 0}%` }} />
              <span className="adm-col-tip" role="tooltip">
                <b>{dayLabel(d.day)}</b>
                <span>
                  {fmt(d.visitors)} visiteur{d.visitors > 1 ? "s" : ""} · {fmt(d.views)} page{d.views > 1 ? "s" : ""}
                </span>
              </span>
            </span>
          ))}
        </div>
        <div className="adm-chart-axis adm-small adm-muted">
          <span>{dayLabel(t.series[0]!.day)}</span>
          <span>aujourd’hui</span>
        </div>
      </div>
      <table className="sr-only">
        <caption>Visiteurs uniques et pages vues par jour</caption>
        <thead>
          <tr>
            <th>Jour</th>
            <th>Visiteurs</th>
            <th>Pages vues</th>
          </tr>
        </thead>
        <tbody>
          {t.series.map((d) => (
            <tr key={d.day}>
              <td>{dayLabel(d.day)}</td>
              <td>{d.visitors}</td>
              <td>{d.views}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid gap-6 md:grid-cols-2" style={{ marginTop: "var(--space-6)" }}>
        <div>
          <h3 className="adm-h3">Pages les plus vues (7 jours)</h3>
          {t.pages.length === 0 ? (
            <p className="adm-small adm-muted">Pas encore de données.</p>
          ) : (
            <ul className="adm-hbars">
              {t.pages.map((p) => (
                <li key={p.path} title={p.path}>
                  <span className="adm-hbar-label">{p.label}</span>
                  <span className="adm-hbar-track" aria-hidden="true">
                    <span className="adm-hbar" style={{ width: `${(p.views / maxPage) * 100}%` }} />
                  </span>
                  <span className="adm-hbar-value">{fmt(p.views)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="adm-h3">Provenance des visiteurs (7 jours)</h3>
          {t.sources.length === 0 ? (
            <p className="adm-small adm-muted">Pas encore de données.</p>
          ) : (
            <ul className="adm-hbars">
              {t.sources.map((s) => (
                <li key={s.source}>
                  <span className="adm-hbar-label">{s.source}</span>
                  <span className="adm-hbar-track" aria-hidden="true">
                    <span className="adm-hbar" style={{ width: `${(s.views / maxSource) * 100}%` }} />
                  </span>
                  <span className="adm-hbar-value">{fmt(s.views)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
