"use client";

import { useRouter } from "next/navigation";
import { SchoolSearch } from "./SchoolSearch";

/** Recherche du hero : choisir un lycée ouvre sa fiche. */
export function HomeSearch() {
  const router = useRouter();
  return (
    <SchoolSearch
      label="Trouve ton lycée"
      placeholder="Nom du lycée, ville ou code postal"
      className="!max-w-none"
      onSelect={(o) => {
        if (o.type === "school") router.push(`/lycee/${o.slug}`);
      }}
    />
  );
}
