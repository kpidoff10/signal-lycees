"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Envoie un événement de consultation (sans donnée personnelle). */
export function TrackView({ event, props }: { event: "school_view" | "issue_view"; props: Record<string, string> }) {
  const key = JSON.stringify(props);
  useEffect(() => {
    (track as (e: string, p: Record<string, string>) => void)(event, JSON.parse(key));
  }, [event, key]);
  return null;
}
