"use client";

import { useEffect, useState, useTransition } from "react";
import { myVotesAction, reportContentAction, resolvedAction, voteAction } from "@/app/actions/issues";
import { useTurnstile } from "@/components/report/useTurnstile";
import { withCaptcha } from "@/components/report/captcha";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/analytics";
import { formatNumber, plural } from "@/lib/format";
import { ConfirmButton } from "./ConfirmButton";

const REPORT_REASONS = [
  { value: "PERSON_TARGETED", label: "Une personne est visée ou reconnaissable" },
  { value: "PERSONAL_DATA", label: "Données personnelles (nom, téléphone, pseudo…)" },
  { value: "INSULT_HARASSMENT", label: "Insulte ou harcèlement" },
  { value: "FALSE_OR_DEFAMATORY", label: "Faux ou diffamatoire" },
  { value: "OTHER", label: "Autre raison" },
] as const;

/** Actions sur la fiche d'un problème. 👎 « pas sérieux » n'a jamais de compteur public. */
export function IssueActions({ issueId, category, upCount, resolved }: { issueId: string; category: string; upCount: number; resolved: boolean }) {
  const [count, setCount] = useState(upCount);
  const [myVote, setMyVote] = useState<"UP" | "DOWN" | null | undefined>(undefined);
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]["value"]>("PERSON_TARGETED");
  const [comment, setComment] = useState("");
  const { getToken, widget } = useTurnstile();

  useEffect(() => {
    myVotesAction([issueId]).then((v) => setMyVote(v[issueId] ?? null), () => setMyVote(null));
  }, [issueId]);

  function run(
    fn: (token: string | null) => Promise<{ ok: boolean; error?: string; code?: string } & Record<string, unknown>>,
    success: string,
    alwaysCaptcha = false,
  ) {
    start(async () => {
      setNotice(null);
      const r = alwaysCaptcha ? await fn(await getToken()) : await withCaptcha(fn, getToken);
      setNotice(r.ok ? { text: success } : { text: r.error ?? "Erreur", error: true });
    });
  }

  return (
    <div className="grid content-start gap-5">
      {!resolved && (
        <div className="grid gap-3 rounded-[20px] border border-border bg-surface p-5">
          <p className="text-[15px]">
            <b className="num font-display text-[28px] leading-8">{formatNumber(count)}</b>{" "}
            {plural(count, "personne confirme", "personnes confirment")} ce problème.
          </p>
          {myVote !== undefined && (
            <ConfirmButton issueId={issueId} category={category} initialVote={myVote} onCount={setCount} block />
          )}
        </div>
      )}

      {!resolved && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon="check"
            disabled={pending}
            onClick={() => {
              track("issue_status_vote", { kind: "resolved" });
              run(
                async (t) => {
                  const r = await resolvedAction({ issueId, turnstileToken: t });
                  return r.ok && r.alreadyVoted ? { ok: false, error: "Tu l’as déjà indiqué, merci !" } : r;
                },
                "Merci ! Le statut évoluera si d’autres élèves le confirment.",
              );
            }}
          >
            Le problème semble résolu
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="thumbDown"
            disabled={pending || myVote === "DOWN"}
            onClick={() => {
              track("issue_status_vote", { kind: "not_serious" });
              run(async (t) => {
                const r = await voteAction({ issueId, choice: "DOWN", turnstileToken: t });
                if (r.ok) {
                  setMyVote("DOWN");
                  setCount(r.upCount);
                }
                return r;
              }, "Merci, c’est noté. La modération vérifiera si besoin.");
            }}
          >
            {myVote === "DOWN" ? "Indiqué comme pas sérieux" : "Ce signalement n’est pas sérieux"}
          </Button>
        </div>
      )}

      <div>
        <Button variant="ghost" size="sm" icon="flag" onClick={() => setReportOpen((o) => !o)} aria-expanded={reportOpen}>
          Signaler un contenu
        </Button>
        {reportOpen && (
          <form
            className="mt-3 grid gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(async (t) => {
                const r = await reportContentAction({ issueId, reason, comment: comment || undefined, turnstileToken: t });
                if (r.ok) setReportOpen(false);
                return r;
              }, "Merci. La modération va examiner ce contenu.", true);
            }}
          >
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-sm font-semibold">Pourquoi ce contenu pose-t-il problème ?</legend>
              {REPORT_REASONS.map((r) => (
                <label key={r.value} className="flex items-center gap-2 text-[15px]">
                  <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="h-4 w-4 accent-[var(--signal)]" />
                  {r.label}
                </label>
              ))}
            </fieldset>
            <label className="grid gap-1 text-sm font-semibold">
              Précision (facultatif)
              <textarea className="field min-h-20 font-normal" maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} />
            </label>
            <Button type="submit" disabled={pending}>
              Envoyer le signalement
            </Button>
          </form>
        )}
      </div>
      {widget}
      <p role="status" aria-live="polite" className={`text-sm ${notice?.error ? "text-signal-ink" : "text-resolved"}`}>
        {notice?.text}
      </p>
    </div>
  );
}
