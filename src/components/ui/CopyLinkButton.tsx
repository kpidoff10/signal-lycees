"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="sl-btn sl-btn-secondary max-md:!w-11 max-md:!rounded-full max-md:!p-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* presse-papiers indisponible */
        }
      }}
      aria-label="Copier le lien de cette page"
    >
      <Icon name={copied ? "check" : "link"} />
      <span className="max-md:hidden">{copied ? "Lien copié" : "Copier le lien"}</span>
    </button>
  );
}
