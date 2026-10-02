"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const placeholder = (
  <div className="sl-nm-stage grid place-items-center text-sm text-ink-muted" aria-busy="true">
    Chargement de la carte…
  </div>
);

// MapLibre ne s'exécute que dans le navigateur : chargement différé, sans rendu serveur.
const NationalMap = dynamic(() => import("./NationalMap"), { ssr: false, loading: () => placeholder });

/**
 * La carte est sous l'écran d'accueil : son code (lourd) n'est chargé qu'à l'approche
 * du défilement, pour que la page soit utilisable tout de suite sur les téléphones modestes.
 */
export function MapSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return setShow(true);
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setShow(true), { rootMargin: "200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref}>{show ? <NationalMap /> : placeholder}</div>;
}
