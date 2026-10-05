"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { publicEnv } from "@/lib/public-env";

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
      s.onerror = () => {
        loading = null;
        reject(new Error("turnstile"));
      };
      document.head.append(s);
    });
  }
  return loading;
}

type GetToken = () => Promise<string | null>;
const TurnstileContext = createContext<GetToken>(async () => null);

/**
 * Un seul widget Cloudflare Turnstile pour tout le site, monté en permanence
 * (il ne doit jamais disparaître pendant qu'on attend un jeton). Invisible tant
 * qu'aucune interaction n'est nécessaire ; chargé seulement à la première demande.
 * Sans clé configurée (développement), les jetons valent null.
 */
export function TurnstileProvider({ children }: { children: ReactNode }) {
  const siteKey = publicEnv.turnstileSiteKey;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const pending = useRef<((t: string | null) => void)[]>([]);
  const [visible, setVisible] = useState(false);

  const flush = useCallback((token: string | null) => {
    pending.current.splice(0).forEach((r) => r(token));
  }, []);

  const ensureWidget = useCallback(async (): Promise<string | null> => {
    if (widgetRef.current) return widgetRef.current;
    await loadScript();
    if (!window.turnstile || !containerRef.current) return null;
    widgetRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      execution: "execute",
      appearance: "interaction-only",
      language: "fr",
      callback: (token: string) => {
        setVisible(false);
        flush(token);
      },
      "error-callback": () => {
        setVisible(false);
        flush(null);
      },
      "expired-callback": () => window.turnstile && widgetRef.current && window.turnstile.reset(widgetRef.current),
      "before-interactive-callback": () => setVisible(true),
      "after-interactive-callback": () => setVisible(false),
    });
    return widgetRef.current;
  }, [siteKey, flush]);

  useEffect(
    () => () => {
      if (widgetRef.current && window.turnstile) window.turnstile.remove(widgetRef.current);
    },
    [],
  );

  const getToken = useCallback<GetToken>(async () => {
    if (!siteKey) return null;
    let id: string | null;
    try {
      id = await ensureWidget();
    } catch {
      return null;
    }
    const t = window.turnstile;
    if (!t || !id) return null;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        pending.current = pending.current.filter((r) => r !== done);
        resolve(null);
      }, 60_000);
      const done = (token: string | null) => {
        clearTimeout(timer);
        resolve(token);
      };
      pending.current.push(done);
      // Un jeton ne sert qu'une fois : on repart d'un widget neuf à chaque demande.
      t.reset(id);
      t.execute(id);
    });
  }, [siteKey, ensureWidget]);

  return (
    <TurnstileContext.Provider value={getToken}>
      {children}
      {siteKey && (
        <div
          role={visible ? "dialog" : undefined}
          aria-label={visible ? "Vérification anti-robot" : undefined}
          className={
            visible
              ? "fixed inset-x-0 bottom-4 z-[60] mx-auto w-fit rounded-[var(--radius-md)] border border-border bg-surface p-3 shadow-float"
              : "pointer-events-none fixed bottom-0 left-0 h-0 w-0 overflow-hidden"
          }
        >
          {visible && <p className="mb-2 text-center text-sm font-semibold">Une petite vérification avant d’envoyer…</p>}
          <div ref={containerRef} />
        </div>
      )}
    </TurnstileContext.Provider>
  );
}

/** Jeton anti-robot pour une action participative (dépôt, vote, signalement de contenu). */
export function useTurnstile() {
  const getToken = useContext(TurnstileContext);
  return { getToken, widget: null };
}
