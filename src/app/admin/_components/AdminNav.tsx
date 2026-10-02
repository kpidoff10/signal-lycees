"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/moderation", label: "Modération", countKey: "queue" },
  { href: "/admin/issues", label: "Signalements" },
  { href: "/admin/schools", label: "Lycées" },
  { href: "/admin/users", label: "Identités" },
  { href: "/admin/mobilisations", label: "Mobilisations", countKey: "mobilizations" },
  { href: "/admin/requests", label: "Demandes", countKey: "requests" },
  { href: "/admin/logs", label: "Journal" },
] as const;

export function AdminNav({ counts }: { counts: { queue: number; requests: number; mobilizations: number } }) {
  const pathname = usePathname();
  return (
    <nav className="adm-nav" aria-label="Administration">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        const count = "countKey" in l ? counts[l.countKey] : 0;
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
            {l.label}
            {count > 0 && (
              <span className="adm-count" aria-label={`${count} en attente`}>
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
