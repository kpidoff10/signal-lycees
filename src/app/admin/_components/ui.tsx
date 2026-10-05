import type { ReactNode } from "react";
import { MODERATION_STATUS_LABEL, ISSUE_STATUS_LABEL } from "@/server/admin/labels";

const dtf = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" });
const df = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Europe/Paris" });

export function formatDateTime(d: Date | null | undefined): string {
  return d ? dtf.format(d) : "—";
}

export function formatDate(d: Date | null | undefined): string {
  return d ? df.format(d) : "—";
}

export function PageHeader({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header>
      <h1 className="adm-h1">{title}</h1>
      {sub && <p className="adm-sub">{sub}</p>}
      {children}
    </header>
  );
}

export function Badge({ children, tone }: { children: ReactNode; tone?: "signal" | "strong" | "ok" | "outline" }) {
  return <span className={`adm-badge${tone ? ` adm-badge-${tone}` : ""}`}>{children}</span>;
}

export function ModerationBadge({ status }: { status: keyof typeof MODERATION_STATUS_LABEL }) {
  const tone = status === "REJECTED" ? "outline" : status === "PUBLISHED" || status === "AUTO_APPROVED" ? "ok" : "signal";
  return <Badge tone={tone}>{MODERATION_STATUS_LABEL[status]}</Badge>;
}

export function StatusBadge({ status }: { status: keyof typeof ISSUE_STATUS_LABEL }) {
  return <Badge tone={status === "RESOLVED" ? "ok" : undefined}>{ISSUE_STATUS_LABEL[status]}</Badge>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="adm-card adm-muted">{children}</p>;
}

export function Submit({
  children,
  variant = "primary",
  name,
  value,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  name?: string;
  value?: string;
}) {
  return (
    <button type="submit" name={name} value={value} className={`sl-btn sl-btn-${variant}`}>
      {children}
    </button>
  );
}

export function InternalReasonField() {
  return (
    <label className="adm-label">
      <span>
        Raison interne <span className="adm-hint">(facultatif, jamais publiée)</span>
      </span>
      <input name="internalReason" className="field" maxLength={1000} autoComplete="off" />
    </label>
  );
}

/** « à l'instant », « il y a 12 min », « il y a 3 h », puis la date. */
export function formatAgo(d: Date | null | undefined, now = new Date()): string {
  if (!d) return "jamais";
  const min = Math.round((now.getTime() - d.getTime()) / 60_000);
  if (min < 1) return "à l’instant";
  if (min < 60) return `il y a ${min} min`;
  if (min < 24 * 60) return `il y a ${Math.round(min / 60)} h`;
  return formatDateTime(d);
}

export function formatDuration(start: Date, end: Date | null | undefined): string {
  if (!end) return "en cours";
  const s = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`;
}
