// Graphiques de /statistiques : SVG dessiné côté serveur, sans bibliothèque ni JavaScript.
// Une seule teinte (--signal) ; chaque marque porte une infobulle native (<title>) et chaque graphique
// a son tableau équivalent pour les lecteurs d'écran.
import { formatNumber } from "@/lib/format";

const fmtDay = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
const fmtDayLong = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

/** Arrondi « lisible » au-dessus du maximum, pour les graduations. */
function niceMax(v: number): number {
  if (v <= 5) return 5;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

/** Lycées mobilisés par jour : barres verticales sur une seule ligne de base. */
export function DailyBars({ data, label }: { data: { day: string; schools: number }[]; label: string }) {
  // Deux tracés à la taille réelle (ordinateur, téléphone) : un SVG réduit rendrait les textes illisibles sur mobile.
  return (
    <figure className="sl-chart">
      <Bars data={data} label={label} W={720} H={240} maxTicks={8} className="sl-chart-svg sl-chart-wide" />
      <Bars data={data} label={label} W={360} H={220} maxTicks={4} className="sl-chart-svg sl-chart-narrow" />
      <table className="sl-visually-hidden">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Jour</th>
            <th scope="col">Lycées mobilisés</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{fmtDayLong(d.day)}</td>
              <td>{d.schools}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Bars({
  data,
  label,
  W,
  H,
  maxTicks,
  className,
}: {
  data: { day: string; schools: number }[];
  label: string;
  W: number;
  H: number;
  maxTicks: number;
  className: string;
}) {
  const pad = { top: 22, right: 8, bottom: 28, left: 36 };
  const max = niceMax(Math.max(1, ...data.map((d) => d.schools)));
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const step = innerW / data.length;
  const barW = Math.max(4, Math.min(28, step - 4));
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const ticks = [0, max / 2, max];
  const peak = data.reduce((a, b) => (b.schools > a.schools ? b : a), data[0]!);
  const last = data.at(-1)!;
  // Étiquettes de date espacées selon la place disponible.
  const every = Math.ceil(data.length / maxTicks);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className={className}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} className={t === 0 ? "sl-chart-base" : "sl-chart-grid"} />
            <text x={pad.left - 6} y={y(t) + 4} textAnchor="end" className="sl-chart-tick">
              {formatNumber(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + i * step + (step - barW) / 2;
          const h = Math.max(d.schools ? 2 : 0, y(0) - y(d.schools));
          const labelled = d === peak || d === last;
          return (
            <g key={d.day} className="sl-chart-hit">
              <title>{`${fmtDayLong(d.day)} : ${formatNumber(d.schools)} lycée${d.schools > 1 ? "s" : ""} mobilisé${d.schools > 1 ? "s" : ""}`}</title>
              {/* Zone de survol plus large que la barre. */}
              <rect x={pad.left + i * step} y={pad.top} width={step} height={innerH} fill="transparent" />
              {h > 0 && <path d={roundedTop(x, y(0) - h, barW, h, Math.min(4, barW / 2))} className="sl-chart-bar" />}
              {labelled && d.schools > 0 && (
                <text x={x + barW / 2} y={y(0) - h - 6} textAnchor="middle" className="sl-chart-value">
                  {formatNumber(d.schools)}
                </text>
              )}
              {i % every === 0 && (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="sl-chart-tick">
                  {fmtDay(d.day)}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );
}

/** Barre verticale arrondie en haut seulement (l'extrémité « donnée »), posée sur la ligne de base. */
function roundedTop(x: number, top: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, h);
  return `M${x},${top + h}V${top + rr}Q${x},${top} ${x + rr},${top}H${x + w - rr}Q${x + w},${top} ${x + w},${top + rr}V${top + h}Z`;
}

/** Problèmes par thème : barres horizontales, valeur et part affichées en texte. */
export function CategoryBars({ data, label }: { data: { id: string; label: string; emoji: string; count: number }[]; label: string }) {
  const total = data.reduce((a, b) => a + b.count, 0);
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <figure className="sl-chart">
      <ul className="sl-hbars" aria-label={label}>
        {data.map((d) => {
          const share = total ? Math.round((100 * d.count) / total) : 0;
          return (
            <li key={d.id} className="sl-hbar" title={`${d.label} : ${formatNumber(d.count)} problème${d.count > 1 ? "s" : ""} actif${d.count > 1 ? "s" : ""} (${share} %)`}>
              <span className="sl-hbar-label">
                <span aria-hidden="true">{d.emoji}</span> {d.label}
              </span>
              <span className="sl-hbar-track" aria-hidden="true">
                {d.count > 0 && <span className="sl-hbar-fill" style={{ width: `${(100 * d.count) / max}%` }} />}
              </span>
              <span className="sl-hbar-value">
                {formatNumber(d.count)} <span className="sl-hbar-share">· {share} %</span>
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
