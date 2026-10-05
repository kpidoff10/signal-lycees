"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

export type NavCounts = { queue: number; requests: number; mobilizations: number; press: number };

type NavLink = { href: string; label: string; icon: IconName; countKey?: keyof NavCounts };

// Regroupées par usage : ce qu'on ouvre chaque jour d'abord, la technique en dernier.
const GROUPS: { title: string; links: NavLink[] }[] = [
  {
    title: "Au quotidien",
    links: [
      { href: "/admin", label: "Tableau de bord", icon: "grid" },
      { href: "/admin/moderation", label: "Modération", icon: "inbox", countKey: "queue" },
      { href: "/admin/mobilisations", label: "Mobilisations", icon: "megaphone", countKey: "mobilizations" },
      { href: "/admin/presse", label: "Presse", icon: "news", countKey: "press" },
    ],
  },
  {
    title: "Contenu",
    links: [
      { href: "/admin/issues", label: "Signalements", icon: "list" },
      { href: "/admin/schools", label: "Lycées", icon: "school" },
      { href: "/admin/users", label: "Identités", icon: "users" },
      { href: "/admin/requests", label: "Demandes", icon: "mail", countKey: "requests" },
    ],
  },
  {
    title: "Diffusion",
    links: [
      { href: "/admin/imports", label: "Imports", icon: "sparkle" },
      { href: "/admin/campagnes", label: "Campagnes", icon: "share" },
    ],
  },
  { title: "Système", links: [{ href: "/admin/logs", label: "Journal", icon: "clock" }] },
];

/** Barre latérale sur ordinateur, rangée de pastilles défilante sur mobile (même liste, mise en page en CSS). */
export function AdminNav({ counts }: { counts: NavCounts }) {
  const pathname = usePathname();
  return (
    <nav className="adm-nav" aria-label="Administration">
      {GROUPS.flatMap((g) => [
        <span key={g.title} className="adm-nav-group" aria-hidden="true">
          {g.title}
        </span>,
        ...g.links.map((l) => {
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
        }),
      ])}
    </nav>
  );
}
