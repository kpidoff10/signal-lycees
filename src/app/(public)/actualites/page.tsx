import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/places/Breadcrumb";
import { PressList } from "@/components/press/PressList";
import { directory } from "@/server/places";
import { latestPress, refreshPressIfStale } from "@/server/press";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Actualités des lycées : la revue de presse",
  description:
    "Les derniers articles de presse sur les lycées en France : blocus, mobilisations lycéennes, locaux, cours non assurés. Mise à jour automatique plusieurs fois par jour.",
  alternates: { canonical: "/actualites" },
};

const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
const dayKey = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" });

export default async function ActualitesPage() {
  await refreshPressIfStale();
  const [articles, dir] = await Promise.all([latestPress(80), directory()]);
  const cityNames = new Map([...dir.cityBySlug.values()].map((c) => [c.slug, c.name]));
  const days = new Map<string, typeof articles>();
  for (const a of articles) {
    const k = dayKey.format(a.publishedAt);
    if (!days.has(k)) days.set(k, []);
    days.get(k)!.push(a);
  }

  return (
    <div className="container-page grid max-w-[820px] gap-8 py-6 md:py-10">
      <div className="grid gap-3">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Actualités" }]} />
        <h1 className="display-m">Les lycées dans la presse</h1>
        <p className="text-ink-muted">
          Les derniers articles qui parlent des lycées en France, récupérés automatiquement et vérifiés avant publication. On n&apos;affiche
          que le titre et la source : pour lire l&apos;article, le lien ouvre le site du média.
        </p>
      </div>
      {articles.length === 0 ? (
        <p className="text-ink-muted">Aucun article pour l&apos;instant. Reviens un peu plus tard.</p>
      ) : (
        [...days.entries()].map(([k, list]) => (
          <section key={k} className="grid gap-3">
            <h2 className="font-display text-xl font-bold first-letter:uppercase">{dayFmt.format(list[0]!.publishedAt)}</h2>
            <PressList articles={list} cityNames={cityNames} showDate={false} />
          </section>
        ))
      )}
      <p className="text-sm text-ink-muted">
        Un article manque ou pose problème ? Écris-nous depuis la page{" "}
        <Link href="/contact" className="underline">
          contact
        </Link>
        . Tu es journaliste ? Tout est sur la page{" "}
        <Link href="/presse" className="underline">
          presse
        </Link>
        .
      </p>
    </div>
  );
}
