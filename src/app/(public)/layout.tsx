import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageViewBeacon } from "@/components/layout/PageViewBeacon";

/** Site public : en-tête et pied de page. L'admin a sa propre mise en page. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <Footer />
      <PageViewBeacon />
    </>
  );
}
