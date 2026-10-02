import Link from "next/link";
import { TrustLine } from "@/components/ui/TrustNote";

const LINKS = [
  { href: "/lycees", label: "Tous les lycées" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/regles", label: "Règles de publication" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cgu", label: "Conditions d’utilisation" },
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/affiches", label: "Affiches à imprimer" },
  { href: "/presse", label: "Presse" },
  { href: "/contact", label: "Contact et suppression" },
];

export function Footer() {
  return (
    <footer className="site-footer mt-12 border-t border-border bg-surface-sunken/60 md:mt-20">
      <div className="container-page grid gap-8 py-8 md:grid-cols-[1.1fr_1fr] md:py-10">
        <div className="grid content-start gap-3">
          <p className="inline-flex items-center gap-2 font-display text-lg font-bold">
            <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-signal shadow-[0_0_0_3px_var(--signal-soft)]" />
            Signal Lycées
          </p>
          <p className="max-w-[460px] text-[14px] leading-5 text-ink-muted">
            Par et pour les lycéens. Des faits, pas un classement : les chiffres comptent des signalements, ils ne notent pas les
            établissements.
          </p>
          <TrustLine link={false} />
          <Link
            href="/aide"
            className="mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] font-semibold hover:border-border-strong"
          >
            Besoin d’aide ? <span className="text-ink-muted">3114 · 119 · 3018</span>
          </Link>
        </div>
        <nav aria-label="Liens du pied de page">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px] leading-5">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink-muted hover:text-ink hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <p className="container-page flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-4 text-[12px] text-ink-muted">
          <span>Projet libre et gratuit, sans publicité ni pistage.</span>
          <a href="https://github.com/kpidoff10/signal-lycees" className="hover:text-ink hover:underline" rel="noopener">
            Code source (AGPL-3.0)
          </a>
        </p>
      </div>
    </footer>
  );
}
