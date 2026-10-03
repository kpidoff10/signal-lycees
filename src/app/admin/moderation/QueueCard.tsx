import Link from "next/link";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { category } from "@/lib/categories";
import { timeAgo } from "@/lib/format";
import { PRIORITY_LABEL, REPORT_REASON_LABEL, RISK_LABEL } from "@/server/admin/labels";
import type { AnalysisView, QueueItem } from "@/server/admin/moderation";
import { EditPublishForm, KeepPublishedForm, PublishForm, RejectForm } from "../_components/ModerationForms";
import { Badge, formatDateTime, ModerationBadge } from "../_components/ui";

const LOW = 0.15;

function urgentKinds(a: AnalysisView | null) {
  const rules = new Set(a?.rules.map((r) => r.code) ?? []);
  const risk = (k: string) => a?.risks.find((r) => r.key === k)?.value ?? 0;
  const distress = rules.has("SELF_HARM") || risk("selfHarm") >= LOW || Boolean(a?.showHelp);
  const danger = rules.has("THREAT") || rules.has("SEXUAL") || risk("threat") >= LOW || risk("sexualMinor") >= LOW;
  // Analyse absente ou muette : on rappelle les deux procédures.
  if (!distress && !danger) return { distress: true, danger: true };
  return { distress, danger };
}

function UrgentBanner({ analysis }: { analysis: AnalysisView | null }) {
  const k = urgentKinds(analysis);
  return (
    <div className="adm-urgent-banner" role="note">
      <strong>⚠ URGENT — à traiter en priorité</strong>
      <ul>
        {k.distress && (
          <li>
            Détresse possible : ressources à rappeler — <b>3114</b> (prévention du suicide), <b>119</b> (enfance en danger),{" "}
            <b>3018</b> (harcèlement et cyberharcèlement). Ne pas publier.
          </li>
        )}
        {k.danger && (
          <li>
            Menace ou contenu sexuel impliquant un mineur : signalement <b>Pharos</b> (internet-signalement.gouv.fr) et/ou <b>119</b> ;
            danger immédiat : <b>17</b> / <b>112</b>. Conserver les éléments, ne pas publier.
          </li>
        )}
      </ul>
    </div>
  );
}

function RiskBars({ analysis }: { analysis: AnalysisView }) {
  if (!analysis.risks.length) return <p className="adm-small adm-muted m-0">Pas de probabilités (analyse IA absente).</p>;
  return (
    <div className="adm-risks">
      {analysis.risks.map((r) => {
        const pct = Math.round(r.value * 100);
        return (
          <div key={r.key} className="adm-risk">
            <span>{RISK_LABEL[r.key]}</span>
            <span className="adm-risk-track" role="img" aria-label={`${RISK_LABEL[r.key]} : ${pct} %`}>
              <span
                className={`adm-risk-fill block${r.value >= 0.5 ? " is-high" : r.value >= LOW ? " is-mid" : ""}`}
                style={{ width: `${Math.max(pct, 1)}%` }}
              />
            </span>
            <span className="adm-risk-val">{pct} %</span>
          </div>
        );
      })}
    </div>
  );
}

function Analysis({ analysis, currentCategory }: { analysis: AnalysisView | null; currentCategory: QueueItem["category"] }) {
  if (!analysis) return <p className="adm-small adm-muted m-0">Aucune analyse enregistrée.</p>;
  return (
    <div className="adm-stack" style={{ gap: "var(--space-3)" }}>
      <p className="adm-meta m-0">
        <Badge tone="outline">{analysis.provider}</Badge>
        {analysis.model && <span>{analysis.model}</span>}
        {!analysis.ok && analysis.error && <span>erreur : {analysis.error}</span>}
        {analysis.severity && <span>gravité : {analysis.severity}</span>}
      </p>
      <p className="m-0 text-[15px] leading-[22px]">{analysis.reason}</p>
      <RiskBars analysis={analysis} />
      {analysis.rules.length > 0 && (
        <div>
          <p className="adm-small adm-muted m-0 mb-1">Règles déclenchées</p>
          <ul className="m-0 grid gap-1 pl-5 text-[14px] leading-[20px]">
            {analysis.rules.map((r, i) => (
              <li key={`${r.code}-${i}`}>
                <b>{r.code}</b> <span className="adm-muted">({r.level})</span>
                {r.match && (
                  <>
                    {" "}
                    : <span className="user-text">« {r.match} »</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {analysis.suggestedCategory && (
        <p className="adm-small m-0">
          Catégorie suggérée : <CategoryBadge id={analysis.suggestedCategory} />
          {analysis.categoryConfidence != null && <span className="adm-muted"> ({Math.round(analysis.categoryConfidence * 100)} %)</span>}
          {analysis.suggestedCategory !== currentCategory && (
            <b className="text-signal-ink"> — différente de « {category(currentCategory).label} »</b>
          )}
        </p>
      )}
    </div>
  );
}

export function QueueCard({ item }: { item: QueueItem }) {
  const urgent = item.reviewPriority === "URGENT";
  const elevated = item.reviewPriority === "ELEVATED";
  const showOriginal =
    !item.originalPurgedAt &&
    (item.originalTitle ?? null) !== null &&
    (item.originalTitle !== item.title || item.originalDescription !== item.description);

  return (
    <article className={`adm-card${urgent ? " adm-urgent" : elevated ? " adm-elevated" : ""}`} aria-labelledby={`t-${item.id}`}>
      {urgent && <UrgentBanner analysis={item.analysis} />}

      <div className="adm-meta">
        {!urgent && item.reviewPriority !== "NORMAL" && <Badge tone="signal">Priorité {PRIORITY_LABEL[item.reviewPriority]}</Badge>}
        <ModerationBadge status={item.moderationStatus} />
        {item.flaggedForReview && <Badge tone="signal">👎 à revoir</Badge>}
        {item.reports.length > 0 && <Badge tone="signal">{item.reports.length} signalement(s) de contenu</Badge>}
        <CategoryBadge id={item.category} />
      </div>

      <p className="mt-3 mb-1 text-[14px] font-semibold leading-[20px]">
        {item.school.name} <span className="adm-muted font-normal">· {item.school.postalCode} {item.school.city}</span>
      </p>
      <h2 id={`t-${item.id}`} className="m-0 text-[19px] font-bold leading-[25px] user-text">
        {item.title}
      </h2>
      <p className="mt-2 mb-0 text-[15px] leading-[22px] user-text">{item.description}</p>

      <p className="adm-meta mt-3 mb-0">
        <span title={formatDateTime(item.createdAt)}>Déposé {timeAgo(item.createdAt)}</span>
        {item.publishedAt && <span>· publié le {formatDateTime(item.publishedAt)}</span>}
        <span className="num">
          · 👍 {item.upCount} · 👎 {item.downCount}
        </span>
        <Link href={`/admin/issues/${item.id}`} className="link">
          Fiche
        </Link>
      </p>

      {showOriginal && (
        <div className="adm-section">
          <h3 className="adm-h2">Texte original de l&apos;élève</h3>
          <div className="adm-quote">
            <p className="m-0 font-bold user-text">{item.originalTitle}</p>
            <p className="mt-1 mb-0 user-text">{item.originalDescription}</p>
          </div>
        </div>
      )}
      {item.originalPurgedAt && <p className="adm-small adm-muted mt-2 mb-0">Texte original purgé le {formatDateTime(item.originalPurgedAt)}.</p>}

      {item.reports.length > 0 && (
        <div className="adm-section">
          <h3 className="adm-h2">Signalements de contenu</h3>
          <ul className="m-0 grid gap-2 pl-5 text-[14px] leading-[20px]">
            {item.reports.map((r) => (
              <li key={r.id}>
                <b>{REPORT_REASON_LABEL[r.reason]}</b> <span className="adm-muted">({timeAgo(r.createdAt)})</span>
                {r.comment && <span className="block user-text">{r.comment}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="adm-section">
        <h3 className="adm-h2">Analyse automatique</h3>
        <Analysis analysis={item.analysis} currentCategory={item.category} />
        {item.secondOpinion && (
          <div className="adm-second">
            <p className="adm-meta m-0">
              <Badge tone="outline">second avis</Badge>
              {item.secondOpinion.model && <span>{item.secondOpinion.model}</span>}
              {!item.secondOpinion.ok && item.secondOpinion.error && <span>erreur : {item.secondOpinion.error}</span>}
            </p>
            <p className="m-0 text-[15px] leading-[22px]">{item.secondOpinion.reason}</p>
          </div>
        )}
      </div>

      {item.similar.length > 0 && (
        <div className="adm-section">
          <h3 className="adm-h2">Problèmes similaires dans ce lycée</h3>
          <ul className="m-0 grid gap-1 pl-5 text-[14px] leading-[20px]">
            {item.similar.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/issues/${s.id}`} className="link user-text">
                  {s.title}
                </Link>{" "}
                <span className="adm-muted num">
                  ({Math.round(s.score * 100)} % · 👍 {s.upCount})
                </span>{" "}
                <ModerationBadge status={s.moderationStatus} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="adm-section">
        <h3 className="adm-h2">Décision</h3>
        {item.isPublic ? (
          <>
            <KeepPublishedForm issueId={item.id} />
            <EditPublishForm issue={item} published />
            <RejectForm issueId={item.id} published />
          </>
        ) : (
          <>
            <PublishForm issueId={item.id} />
            <EditPublishForm issue={item} published={false} />
            <RejectForm issueId={item.id} published={false} />
          </>
        )}
      </div>
    </article>
  );
}
