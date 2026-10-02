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
      <section className="hero-screen relative">
        <div className="container-page grid grid-cols-[minmax(0,1fr)] items-center gap-10 py-10 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <p className="eyebrow">Par et pour les lycéens</p>
          <h1 className="display-l mt-3 md:mt-4">Ce qui se passe dans ton lycée mérite d’être entendu.</h1>
          <p className="mt-4 max-w-[560px] text-[17px] leading-[25px] text-ink-muted md:mt-6 md:text-[18px] md:leading-[26px]">
            <span className="md:hidden">Signale un problème et vois si d’autres élèves le vivent aussi. Anonyme, vérifié, sans classement.</span>
            <span className="hidden md:inline">
              Signale un problème, découvre si d’autres élèves le rencontrent et fais remonter les situations qui comptent. C’est anonyme,
              chaque signalement est vérifié, et il n’y a ni note ni classement : juste des faits.
            </span>
          </p>
          <div className="mt-6 grid max-w-[600px] gap-3 md:mt-8">
            <p className="text-sm font-semibold max-md:hidden">Recherche ton lycée</p>
            <HomeSearch />
            <div className="mt-1 flex gap-2 md:mt-2 md:gap-3">
              <ButtonLink href="/signaler" className="max-md:flex-1">
                Signaler un problème
              </ButtonLink>
              <ButtonLink href="/#carte" variant="secondary" className="max-md:flex-1">
                <span className="md:hidden">Voir la carte</span>
                <span className="hidden md:inline">Trouver mon lycée sur la carte</span>
              </ButtonLink>
            </div>
            <TrustLine className="mt-1 md:mt-2" />
          </div>
          {/* Mobile et tablette : les derniers signalements dans la première partie. */}
          <div className="hero-latest mt-6 lg:hidden">
            <LatestIssues items={latest} variant="scroll" />
          </div>
        </div>

        <div className="hidden min-w-0 lg:block">
          <LatestIssues items={latest} variant="stack" />
        </div>
        </div>
        <a href="#carte" className="hero-scroll" aria-label="Explorer la carte des lycées">
          <span>Explorer la carte</span>
          <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        </a>
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
