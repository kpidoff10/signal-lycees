"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
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

/**
 * Barre latérale sur ordinateur ; sur mobile, bouton « Menu » (hamburger) qui ouvre la même liste
 * dans un panneau, refermé à chaque changement de page.
 */
export function AdminNav({ counts, menuFooter }: { counts: NavCounts; menuFooter?: ReactNode }) {
  const pathname = usePathname();
  // Ouvert « sur » une page : naviguer ailleurs le referme sans effet de bord.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const pending = counts.queue + counts.mobilizations + counts.press + counts.requests;
  return (
    <>
      <button
        type="button"
        className="adm-burger"
        aria-expanded={open}
        aria-controls="adm-menu"
        onClick={() => setOpenOn(open ? null : pathname)}
      >
        <Icon name={open ? "close" : "menu"} size={20} />
        <span>Menu</span>
        {pending > 0 && !open && <span className="adm-count">{pending > 99 ? "99+" : pending}</span>}
      </button>
    <nav
      id="adm-menu"
      className={`adm-nav${open ? " is-open" : ""}`}
      aria-label="Administration"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpenOn(null);
      }}
    >
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
      {menuFooter && <div className="adm-nav-foot">{menuFooter}</div>}
    </nav>
    </>
  );
}
