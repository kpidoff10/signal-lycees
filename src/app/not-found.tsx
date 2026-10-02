import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="contenu" className="container-page flex-1 py-20">
        <p className="eyebrow">Erreur 404</p>
        <h1 className="display-m mt-3">Cette page n’existe pas (ou plus).</h1>
        <p className="mt-4 max-w-[560px] text-ink-muted">
          Le lien est peut-être incorrect, ou le signalement a été retiré. Tu peux chercher ton lycée depuis l’accueil.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/">Retour à l’accueil</ButtonLink>
          <Link href="/signaler" className="sl-btn sl-btn-secondary">
            Signaler un problème
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
