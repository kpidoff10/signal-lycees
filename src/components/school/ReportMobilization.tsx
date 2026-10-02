"use client";

import { useState, useTransition } from "react";
import { reportMobilizationAction } from "@/app/actions/mobilizations";
import { withCaptcha } from "@/components/report/captcha";
import { useTurnstile } from "@/components/report/useTurnstile";
import { Button } from "@/components/ui/Button";

const WHEN = [
  { value: "today", label: "Aujourd’hui" },
  { value: "yesterday", label: "Hier" },
  { value: "2days", label: "Avant-hier" },
] as const;

/** Un élève signale une mobilisation (blocus, rassemblement) : publiée après validation. */
export function ReportMobilization({ schoolId }: { schoolId: string }) {
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState<(typeof WHEN)[number]["value"]>("today");
  const [reasons, setReasons] = useState("");
  const [result, setResult] = useState<{ text: string; error?: boolean } | null>(null);
  const [pending, start] = useTransition();
  const { getToken } = useTurnstile();

  if (!open)
    return (
      <button type="button" className="link text-sm" onClick={() => setOpen(true)}>
        📣 Il y a une mobilisation dans ce lycée ? Signale-la
      </button>
    );

  return (
    <form
      className="grid gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await withCaptcha((token) => reportMobilizationAction({ schoolId, when, reasons: reasons || undefined, turnstileToken: token }), getToken);
          if (!r.ok) return setResult({ text: r.error, error: true });
          setResult({
            text:
              r.status === "already_active"
                ? "Une mobilisation est déjà affichée pour ce lycée. Merci !"
                : r.status === "already_reported"
                  ? "Tu l’as déjà signalée, merci ! Elle sera vérifiée."
                  : "Merci ! Elle apparaîtra après vérification par la modération.",
          });
        });
      }}
    >
      <p className="font-semibold">📣 Signaler une mobilisation (blocus, rassemblement…)</p>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-1.5 text-sm text-ink-muted">Quand ?</legend>
        {WHEN.map((w) => (
          <label key={w.value} className="sl-chip !h-9 cursor-pointer" aria-pressed={when === w.value ? "true" : "false"}>
            <input type="radio" name="when" value={w.value} checked={when === w.value} onChange={() => setWhen(w.value)} className="sr-only" />
            {w.label}
          </label>
        ))}
      </fieldset>
      <label className="grid gap-1 text-sm font-semibold">
        Pourquoi ? (facultatif)
        <textarea
          className="field min-h-20 font-normal"
          maxLength={200}
          value={reasons}
          onChange={(e) => setReasons(e.target.value)}
          placeholder="Ex. : manque de profs, classes surchargées, chauffage…"
        />
      </label>
      <p className="text-[13px] text-ink-muted">
        Pas de nom, pas d’heure ni de lieu de rendez-vous. Ce n’est pas affiché tout de suite : la modération vérifie d’abord.
      </p>
      {result && (
        <p role="status" className={`text-sm font-semibold ${result.error ? "text-signal-ink" : "text-resolved"}`}>
          {result.text}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || (!!result && !result.error)}>
          {pending ? "Envoi…" : "Envoyer"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Fermer
        </Button>
      </div>
    </form>
  );
}
