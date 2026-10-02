import { ButtonLink } from "@/components/ui/Button";
import { StatCounters } from "@/components/ui/Stats";
import { TrustLine, TrustNote } from "@/components/ui/TrustNote";
import { HomeSearch } from "@/components/school/HomeSearch";
import { LiveActivity } from "@/components/map/LiveActivity";
import { MapSection } from "@/components/map/MapSection";
import { plural } from "@/lib/format";
import { latestIssues, nationalStats, todayActivity } from "@/server/stats";
import { LatestIssues } from "@/components/issue/LatestIssues";

export const revalidate = 120;

export default async function HomePage() {
  const [stats, activity, latest] = await Promise.all([nationalStats(), todayActivity(), latestIssues(4)]);

  return (
    <>
      <section className="container-page grid grid-cols-[minmax(0,1fr)] items-center gap-10 pb-16 pt-10 md:pt-20 lg:grid-cols-[1.25fr_1fr]">
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

        <div className="min-w-0">
          <LatestIssues items={latest} />
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
