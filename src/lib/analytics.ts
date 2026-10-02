// Analytics respectueux de la vie privée (Plausible, sans cookie).
// Propriétés strictement typées : jamais de texte de signalement, de requête
// de recherche ni d'identifiant de participant.
type Props = {
  school_search: undefined;
  school_view: { school: string };
  map_marker_click: { school: string };
  issue_view: { category: string };
  issue_start: undefined;
  issue_submitted: { category: string; outcome: string };
  duplicate_detected: { category: string };
  issue_confirmed: { category: string };
  issue_status_vote: { kind: "resolved" | "not_serious" };
};

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}

export function track<E extends keyof Props>(event: E, ...props: Props[E] extends undefined ? [] : [Props[E]]) {
  if (typeof window === "undefined" || !window.plausible) return;
  const p = props[0] as Record<string, string> | undefined;
  window.plausible(event, p ? { props: p } : undefined);
}
