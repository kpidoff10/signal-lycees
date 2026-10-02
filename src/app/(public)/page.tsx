import Link from "next/link";
import { CategoryBadge, ResolvedBadge } from "@/components/ui/CategoryBadge";
import { ButtonLink } from "@/components/ui/Button";
import { StatCounters } from "@/components/ui/Stats";
import { TrustLine, TrustNote } from "@/components/ui/TrustNote";
import { HomeSearch } from "@/components/school/HomeSearch";
import { LiveActivity } from "@/components/map/LiveActivity";
import { MapSection } from "@/components/map/MapSection";
import { countLabel, formatNumber, plural, timeAgo } from "@/lib/format";
import { heroHighlights, nationalStats, todayActivity } from "@/server/stats";

export const revalidate = 120;

export default async function HomePage() {
  const [stats, activity, highlights] = await Promise.all([nationalStats(), todayActivity(), heroHighlights()]);

  return (
    <>
      <section className="container-page grid items-center gap-10 pb-16 pt-10 md:pt-20 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <p className="eyebrow">Par et pour les lycéens</p>
          <h1 className="display-l mt-4">Ce qui se passe dans ton lycée mérite d’être entendu.</h1>
          <p className="mt-6 max-w-[560px] text-[18px] leading-[26px] text-ink-muted">
            Signale un problème, découvre si d’autres élèves le rencontrent et fais remonter les situations qui comptent. C’est anonyme,
            chaque signalement est vérifié, et il n’y a ni note ni classement : juste des faits.
          </p>
          <div className="mt-8 grid max-w-[600px] gap-3">
            <p className="text-sm font-semibold">Recherche ton lycée</p>
            <HomeSearch />
            <div className="mt-2 flex flex-wrap gap-3">
              <ButtonLink href="/signaler">Signaler un problème</ButtonLink>
              <ButtonLink href="/#carte" variant="secondary">
                Trouver mon lycée sur la carte
              </ButtonLink>
            </div>
            <TrustLine className="mt-2" />
          </div>
        </div>

        <div className="relative hidden min-h-[360px] lg:block" aria-hidden={!highlights.top && !highlights.resolved}>
          {highlights.top ? (
            <Link
              href={`/lycee/${highlights.top.school.slug}`}
              className="absolute left-0 top-0 w-[380px] rounded-[20px] border border-border bg-surface p-6 shadow-float transition-transform hover:-translate-y-0.5"
            >
              <span className="flex justify-between text-[13px] text-ink-muted">
                <span className="font-semibold text-ink">
                  {highlights.top.school.name} · {highlights.top.school.city}
                </span>
                <span>{timeAgo(highlights.top.createdAt)}</span>
              </span>
              <span className="mt-3 block">
                <CategoryBadge id={highlights.top.category} />
              </span>
              <span className="mt-3 block font-display text-[22px] font-bold leading-[28px]">{highlights.top.title}</span>
              <span className="mt-4 block text-sm text-ink-muted">
                <b className="num text-[17px] text-signal-ink">{formatNumber(highlights.top.upCount)}</b>{" "}
                {plural(highlights.top.upCount, "confirmation")}
              </span>
            </Link>
          ) : (
            <div className="absolute left-0 top-0 w-[380px] rounded-[20px] border border-border bg-surface p-6 shadow-float">
              <span className="cat-badge">
                <span aria-hidden="true">🏫</span>Locaux
              </span>
              <p className="mt-3 font-display text-[22px] font-bold leading-[28px]">Plusieurs salles sans chauffage</p>
              <p className="mt-2 text-sm text-ink-muted">Exemple de signalement : une situation, jamais une personne.</p>
            </div>
          )}
          {highlights.resolved && (
            <Link
              href={`/lycee/${highlights.resolved.school.slug}`}
              className="absolute bottom-0 right-0 w-[320px] rounded-[20px] border border-border bg-surface p-5 shadow-float transition-transform hover:-translate-y-0.5"
            >
              <ResolvedBadge />
              <span className="mt-2 block font-semibold">{highlights.resolved.title}</span>
              <span className="mt-1 block text-[13px] text-ink-muted">
                {highlights.resolved.school.name} · {highlights.resolved.school.city} · {countLabel(highlights.resolved.upCount, "confirmation")}
              </span>
            </Link>
          )}
        </div>
      </section>

      <section id="carte" className="container-page scroll-mt-20 pt-8" aria-labelledby="carte-titre">
        <div className="sl-nm-head">
          <h2 id="carte-titre" className="display-m">
            Que se passe-t-il dans les lycées en France ?
          </h2>
          <p className="sl-nm-sub">Explore les problèmes signalés par les lycéens partout en France.</p>
        </div>
        <div className="sl-nm-stats">
          <StatCounters
            items={[
              { value: stats.activeIssues, label: plural(stats.activeIssues, "problème actif", "problèmes actifs"), tone: "signal" },
              { value: stats.schoolsConcerned, label: plural(stats.schoolsConcerned, "lycée concerné", "lycées concernés") },
              { value: stats.confirmations, label: plural(stats.confirmations, "confirmation") },
              { value: stats.resolvedIssues, label: plural(stats.resolvedIssues, "problème résolu", "problèmes résolus"), tone: "resolved" },
            ]}
          />
        </div>
        <div className="sl-nm-live">
          <LiveActivity initial={activity} />
        </div>
        <MapSection />
      </section>

      <section className="container-page mt-20" aria-labelledby="confiance-titre">
        <h2 id="confiance-titre" className="font-display text-[26px] font-bold leading-8 md:text-[32px] md:leading-9">
          Tu peux signaler sans crainte
        </h2>
        <TrustNote className="mt-5" />
      </section>

      <section className="container-page mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-label="Comment ça marche">
        {[
          { n: "1", t: "Signale", d: "Choisis ton lycée, une catégorie, et décris la situation en quelques lignes. C’est anonyme : pas de compte, pas d’e-mail." },
          { n: "2", t: "On vérifie", d: "Chaque signalement est relu avant publication pour qu’il décrive une situation, jamais une personne." },
          { n: "3", t: "Confirme", d: "Tu vis le même problème ? Confirme-le : plus il y a de confirmations, plus il est visible." },
          { n: "4", t: "Suis", d: "Indique quand un problème semble résolu. La communauté garde une trace honnête de ce qui change." },
        ].map((s) => (
          <div key={s.n} className="rounded-[20px] border border-border bg-surface p-6">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-signal-soft font-display font-bold text-signal-ink">{s.n}</span>
            <h3 className="mt-4 font-display text-xl font-bold">{s.t}</h3>
            <p className="mt-2 text-ink-muted">{s.d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
