"use client";

import { useState } from "react";
import { Icon } from "./Icon";

/** Ouvre le menu de partage du téléphone ; sur ordinateur, copie le lien. */
export function ShareButton({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="sl-btn sl-btn-secondary max-md:!w-11 max-md:!rounded-full max-md:!p-0"
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
          try {
            await navigator.share({ title, text, url });
            return;
          } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
          }
        }
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* presse-papiers indisponible */
        }
      }}
      aria-label="Partager cette page"
    >
      <Icon name={copied ? "check" : "share"} />
      <span className="max-md:hidden">{copied ? "Lien copié" : "Partager"}</span>
    </button>
  );
}
