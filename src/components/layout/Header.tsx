"use client";

import Link from "next/link";
import { useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function Logo() {
  return (
    <Link href="/" className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap font-display text-[21px] font-bold leading-none tracking-[-0.01em]">
      <span aria-hidden="true" className="inline-block h-3.5 w-3.5 rounded-full bg-signal shadow-[0_0_0_4px_var(--signal-soft)]" />
      Signal Lycées
    </Link>
  );
}

const NAV = [
  { href: "/#carte", label: "La carte" },
  { href: "/lycees", label: "Lycées" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/affiches", label: "Affiches" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <div className="container-page flex h-16 items-center gap-6 lg:gap-8">
        <Logo />
        <nav aria-label="Navigation principale" className="hidden gap-7 whitespace-nowrap text-[15px] font-semibold lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-signal-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden shrink-0 md:block">
          <ButtonLink href="/signaler">Signaler un problème</ButtonLink>
        </div>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-sunken max-md:ml-auto lg:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? "close" : "menu"} size={22} />
        </button>
      </div>
      {open && (
        <nav id="menu-mobile" aria-label="Menu" className="container-page grid gap-1 pb-4 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-md px-2 py-3 text-[17px] font-semibold hover:bg-surface-sunken">
              {n.label}
            </Link>
          ))}
          <ButtonLink href="/signaler" block className="mt-2 md:hidden" onClick={() => setOpen(false)}>
            Signaler un problème
          </ButtonLink>
        </nav>
      )}
    </header>
  );
}
