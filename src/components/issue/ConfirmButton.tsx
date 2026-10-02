"use client";

import { useState, useTransition } from "react";
import { voteAction } from "@/app/actions/issues";
import { Icon } from "@/components/ui/Icon";
import { useTurnstile } from "@/components/report/useTurnstile";
import { track } from "@/lib/analytics";

/**
 * « Je confirme » : ajoute (ou retire) la confirmation de l'élève.
 * Le compteur affiché est celui renvoyé par le serveur.
 */
export function ConfirmButton({
  issueId,
  category,
  initialVote,
  onCount,
  size = "md",
  block,
}: {
  issueId: string;
  category: string;
  initialVote: "UP" | "DOWN" | null;
  onCount?: (n: number) => void;
  size?: "md" | "sm";
  block?: boolean;
}) {
  const [vote, setVote] = useState(initialVote);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const { getToken, widget } = useTurnstile();
  const confirmed = vote === "UP";

  function toggle() {
    start(async () => {
      setMessage(null);
      const token = await getToken();
      const r = await voteAction({ issueId, choice: confirmed ? "NONE" : "UP", turnstileToken: token });
      if (!r.ok) {
        setMessage({ text: r.error, error: true });
        return;
      }
      setVote(r.myVote === "UP" ? "UP" : r.myVote === "DOWN" ? "DOWN" : null);
      onCount?.(r.upCount);
      if (r.myVote === "UP") {
        setMessage({ text: "Ta confirmation a été prise en compte." });
        track("issue_confirmed", { category });
      } else setMessage(null);
    });
  }

  return (
    <div className={block ? "grid gap-2" : "inline-grid justify-items-end gap-1"}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={confirmed}
        className={`sl-btn ${confirmed ? "sl-btn-confirmed" : "sl-btn-secondary"} ${size === "sm" ? "sl-btn-sm" : ""} ${block ? "sl-btn-block" : ""}`}
      >
        {confirmed && <Icon name="check" />}
        {pending ? "…" : confirmed ? "Confirmé" : block ? "Je rencontre aussi ce problème" : "Je confirme"}
      </button>
      {widget}
      <span role="status" aria-live="polite" className={`text-[13px] ${message?.error ? "text-signal-ink" : "text-resolved"}`}>
        {message?.text}
      </span>
    </div>
  );
}
