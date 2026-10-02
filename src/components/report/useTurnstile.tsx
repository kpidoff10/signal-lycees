"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { publicEnv } from "@/lib/env";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      execute: (id: string) => void;
      reset: (id: string) => void;
      getResponse: (id: string) => string | undefined;
      remove: (id: string) => void;
    };
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("turnstile"));
      document.head.append(s);
    });
  }
  return loading;
}

/**
 * Vérification anti-robot Cloudflare Turnstile, invisible tant qu'aucune
 * interaction n'est nécessaire. Sans clé configurée (développement), renvoie null.
 */
export function useTurnstile() {
  const siteKey = publicEnv.turnstileSiteKey;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const pending = useRef<((t: string | null) => void)[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          execution: "execute",
          appearance: "interaction-only",
          language: "fr",
          callback: (token: string) => {
            setVisible(false);
            pending.current.splice(0).forEach((r) => r(token));
          },
          "error-callback": () => pending.current.splice(0).forEach((r) => r(null)),
          "before-interactive-callback": () => setVisible(true),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (widgetRef.current && window.turnstile) window.turnstile.remove(widgetRef.current);
    };
  }, [siteKey]);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!siteKey) return null;
    const t = window.turnstile;
    const id = widgetRef.current;
    if (!t || !id) return null;
    const existing = t.getResponse(id);
    if (existing) {
      t.reset(id);
      return existing;
    }
    return new Promise((resolve) => {
      pending.current.push(resolve);
      t.execute(id);
      setTimeout(() => resolve(null), 30_000);
    });
  }, [siteKey]);

  const widget = siteKey ? <div ref={containerRef} className={visible ? "my-3" : "h-0 overflow-hidden"} /> : null;
  return { getToken, widget };
}
