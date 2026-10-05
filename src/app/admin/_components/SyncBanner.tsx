"use client";

// Bandeau « synchronisation en cours » de l'admin : interroge /admin/sync (toutes les 4 s pendant une
// synchronisation, toutes les 15 s sinon, jamais quand l'onglet est caché), puis annonce le résultat
// et rafraîchit la page.
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SyncState } from "@/server/admin/imports";

const KIND_RUNNING: Record<string, string> = {
  RESEARCH: "Recherche des mobilisations en cours",
  PRESS: "Revue de presse en cours",
  FILE: "Import en cours",
};

function resultText(r: SyncState["finished"][number]): string {
  if (r.status === "ERROR") return `${r.label} : échec (détail dans Imports).`;
  const s = (r.stats ?? {}) as Record<string, number>;
  if (r.kind === "RESEARCH") return `Recherche terminée : ${s.created ?? 0} lycée(s) à valider, ${s.alreadyKnown ?? 0} déjà sur la carte.`;
  if (r.kind === "PRESS") return `Revue de presse terminée : ${s.added ?? 0} nouvel(s) article(s), ${s.published ?? 0} publié(s).`;
  return `${r.label} : terminé.`;
}

const elapsed = (iso: string, now: number) => {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`;
};

export function SyncBanner({ initial }: { initial: SyncState }) {
  const router = useRouter();
  // Gardé dans une référence : le chronomètre redessine le bandeau chaque seconde, et la boucle
  // d'interrogation ne doit pas être relancée (donc retardée) à chaque fois.
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  const [state, setState] = useState(initial);
  const [done, setDone] = useState<SyncState["finished"][number] | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const watched = useRef(new Set(initial.running.map((r) => r.id)));
  const running = state.running.length > 0;

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (stop) return;
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch("/admin/sync", { cache: "no-store" });
          if (res.ok) {
            const next = (await res.json()) as SyncState;
            const ended = next.finished.find((f) => watched.current.has(f.id));
            for (const r of next.running) watched.current.add(r.id);
            if (ended) {
              watched.current.delete(ended.id);
              setDone(ended);
              routerRef.current.refresh();
            }
            setState(next);
          }
        } catch {
          // Réseau coupé : on réessaiera au prochain tour.
        }
      }
      timer = setTimeout(poll, watched.current.size ? 4000 : 15000);
    };
    // Un clic sur « Lancer maintenant » : on regarde tout de suite (et encore un peu après).
    const onSubmit = (e: Event) => {
      if ((e.target as HTMLElement).closest(".adm-auto-action")) {
        clearTimeout(timer);
        timer = setTimeout(poll, 1500);
      }
    };
    document.addEventListener("submit", onSubmit, true);
    timer = setTimeout(poll, watched.current.size ? 4000 : 15000);
    return () => {
      stop = true;
      clearTimeout(timer);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  // Chronomètre affiché pendant la synchronisation.
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  // Le résultat reste affiché 10 s.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(null), 10_000);
    return () => clearTimeout(t);
  }, [done]);

  if (!running && !done) return null;
  return (
    <div className={`adm-sync${running ? " is-running" : done?.status === "ERROR" ? " is-error" : " is-done"}`} role="status" aria-live="polite">
      {running ? (
        <>
          <span className="adm-sync-spinner" aria-hidden="true" />
          <span>
            {state.running.map((r) => (
              <span key={r.id} className="adm-sync-line">
                <b>{KIND_RUNNING[r.kind] ?? r.label}</b> ·{" "}
                {/* Le chronomètre diffère forcément d'une seconde entre le serveur et le navigateur. */}
                <span suppressHydrationWarning>depuis {elapsed(r.startedAt, now)}</span>
              </span>
            ))}
            <span className="adm-sync-hint">Tu peux continuer : la page se mettra à jour toute seule à la fin.</span>
          </span>
        </>
      ) : (
        done && (
          <>
            <span aria-hidden="true">{done.status === "ERROR" ? "⚠️" : "✅"}</span>
            <span>
              <b>{resultText(done)}</b>{" "}
              <a href="/admin/imports" className="link">
                Voir l’historique
              </a>
            </span>
          </>
        )
      )}
    </div>
  );
}
