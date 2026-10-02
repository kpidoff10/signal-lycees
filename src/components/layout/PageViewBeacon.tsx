"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Signale chaque page vue au compteur interne (sans cookie). Respecte
 * « Do Not Track » et le signal Global Privacy Control du navigateur.
 */
export function PageViewBeacon() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
    // Le référent n'a de sens qu'à l'arrivée sur le site.
    const body = JSON.stringify({ p: pathname, r: first.current ? document.referrer : "" });
    first.current = false;
    try {
      if (!navigator.sendBeacon?.("/api/v", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/v", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
      }
    } catch {
      /* rien : la mesure ne doit jamais gêner la navigation */
    }
  }, [pathname]);
  return null;
}
