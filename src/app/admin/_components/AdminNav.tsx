"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

export type NavCounts = { queue: number; requests: number; mobilizations: number; press: number };

const LINKS: { href: string; label: string; icon: IconName; countKey?: keyof NavCounts }[] = [
  { href: "/admin", label: "Tableau de bord", icon: "grid" },
  { href: "/admin/moderation", label: "Modération", icon: "inbox", countKey: "queue" },
  { href: "/admin/issues", label: "Signalements", icon: "list" },
  { href: "/admin/mobilisations", label: "Mobilisations", icon: "megaphone", countKey: "mobilizations" },
  { href: "/admin/presse", label: "Presse", icon: "news", countKey: "press" },
  { href: "/admin/schools", label: "Lycées", icon: "school" },
  { href: "/admin/users", label: "Identités", icon: "users" },
  { href: "/admin/requests", label: "Demandes", icon: "mail", countKey: "requests" },
  { href: "/admin/logs", label: "Journal", icon: "clock" },
];

/** Barre latérale sur ordinateur, rangée de pastilles défilante sur mobile (même liste, mise en page en CSS). */
export function AdminNav({ counts }: { counts: NavCounts }) {
  const pathname = usePathname();
  return (
    <nav className="adm-nav" aria-label="Administration">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        const count = l.countKey ? counts[l.countKey] : 0;
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
            <Icon name={l.icon} size={18} />
            <span className="adm-nav-label">{l.label}</span>
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
