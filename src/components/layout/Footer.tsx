import Link from "next/link";

const LINKS = [
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/regles", label: "Règles de publication" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cgu", label: "Conditions d’utilisation" },
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/contact", label: "Contact et suppression" },
  { href: "/aide", label: "Besoin d’aide ?" },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface-sunken/60">
      <div className="container-page grid gap-6 py-10 text-sm text-ink-muted md:grid-cols-[1.2fr_2fr]">
        <div className="grid gap-2">
          <p className="font-display text-lg font-bold text-ink">Signal Lycées</p>
          <p>
            Par et pour les lycéens. Des faits, pas un classement : les chiffres comptent des signalements, ils ne notent pas
            les établissements.
          </p>
          <p>Signalements anonymes et vérifiés avant publication. Projet libre et gratuit, sans publicité ni pistage.</p>
        </div>
        <nav aria-label="Liens du pied de page">
          <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-ink hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
