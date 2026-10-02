"use client";

import { useEffect, useRef, useState } from "react";
import type { LatestIssue } from "@/server/stats";
import { LatestCard } from "./LatestIssues";

/** Carrousel mobile des derniers signalements : défilement au doigt + pastilles. */
export function LatestCarousel({ items }: { items: LatestIssue[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const cards = [...list.children] as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(cards.indexOf(e.target as HTMLElement));
      },
      { root: list, threshold: 0.6 },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [items]);

  function go(i: number) {
    const card = listRef.current?.children[i] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }

  return (
    <div>
      <ul
        ref={listRef}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] md:-mx-12 md:scroll-px-12 md:px-12 [&::-webkit-scrollbar]:hidden"
        aria-label="Derniers signalements"
      >
        {items.map((i) => (
          <li key={i.id} className="w-[82%] max-w-[360px] shrink-0 snap-start">
            <LatestCard i={i} className="h-full !shadow-none" />
          </li>
        ))}
      </ul>
      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="Choisir un signalement">
          {items.map((i, k) => (
            <button
              key={i.id}
              type="button"
              role="tab"
              aria-selected={k === active}
              aria-label={`Signalement ${k + 1} sur ${items.length}`}
              onClick={() => go(k)}
              className="grid h-6 place-items-center px-0.5"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-200 ${k === active ? "w-6 bg-signal" : "w-2 bg-border-strong"}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
