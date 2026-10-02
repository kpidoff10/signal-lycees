"use client";

import { useRouter } from "next/navigation";
import { SchoolSearch } from "@/components/school/SchoolSearch";

export function AffichePicker() {
  const router = useRouter();
  return (
    <SchoolSearch
      label="Ton lycée"
      placeholder="Nom du lycée ou ville"
      onSelect={(o) => {
        if (o.type === "school") router.push(`/affiches/${o.slug}`);
      }}
    />
  );
}
