import { shortSchoolName } from "@/lib/school-name";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { ShareButton } from "@/components/ui/ShareButton";
import { StatCounters } from "@/components/ui/Stats";
import { TrustLine } from "@/components/ui/TrustNote";
import { IssueList } from "@/components/issue/IssueList";
import { TrackView } from "@/components/ui/TrackView";
import { category, type CategoryId } from "@/lib/categories";
import { plural } from "@/lib/format";
import { getSchoolBySlug, getSchoolIssues } from "@/server/school-page";
import { activeMobilizations } from "@/server/mobilizations";
import { directory } from "@/server/places";
import { nearbySchools, withActivity } from "@/server/schools";
import { Breadcrumb } from "@/components/places/Breadcrumb";
import { PlaceLinkGrid } from "@/components/places/PlaceLists";
import { cityLabel, inCity } from "@/lib/places";
import { MobilizationBanner } from "@/components/school/MobilizationBanner";
import { ReportMobilization } from "@/components/school/ReportMobilization";

export const revalidate = 60;

// Fiches générées à la première visite puis mises en cache (ISR), pas au build.
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const school = await getSchoolBySlug(slug);
  if (!school) return { title: "Lycée introuvable" };
  const city = cityLabel(school.city);
  const name = shortSchoolName(school.name);
  // Quand le lycée est mobilisé, le titre reprend les mots de l'actualité (« blocus », « mobilisation »).
  const mob = (await activeMobilizations([school.id])).get(school.id);
  return {
    // Le gabarit ajoute « | Signal Lycées ». Nom court : Google coupe les titres vers 60 caractères.
    title: mob ? `Mobilisation au ${name} (${city}) : blocus et signalements` : `${name} (${city}) : problèmes signalés par les élèves`,
    description: mob
      ? `Mobilisation en cours au ${school.name} (${city}) : blocus, rassemblement, et les problèmes signalés anonymement par les élèves.`
      : `Consultez les problèmes actuellement signalés au ${school.name} (${city}) et les informations remontées par sa communauté.`,
    alternates: { canonical: `/lycee/${school.slug}` },
    openGraph: { title: `${school.name} — ${school.city}`, url: `/lycee/${school.slug}` },
  };
}

function daysSince(dates: string[]): string {
  if (!dates.length) return "—";
  const last = Math.max(...dates.map((d) => new Date(d).getTime()));
  const days = Math.floor((Date.now() - last) / 86_400_000);
  return days === 0 ? "aujourd’hui" : `${days} ${plural(days, "jour")}`;
}

export default async function SchoolPage({ params }: Props) {
  const { slug } = await params;
  const school = await getSchoolBySlug(slug);
  if (!school) notFound();
  const [issues, mobs, dir, near] = await Promise.all([
    getSchoolIssues(school.id),
    activeMobilizations([school.id]),
    directory(),
    nearbySchools(school.latitude, school.longitude, 7).then((hits) => withActivity(hits.filter((h) => h.id !== school.id).slice(0, 6))),
  ]);
  const place = dir.cityBySlug.get(dir.citySlugBySchool.get(school.id) ?? "");
  const mobilization = mobs.get(school.id) ?? null;

  const active = issues.filter((i) => i.status !== "RESOLVED");
  const resolved = issues.filter((i) => i.status === "RESOLVED");
  const confirmations = issues.reduce((s, i) => s + i.upCount, 0);
  const byCat = new Map<CategoryId, number>();
  for (const i of active) byCat.set(i.category, (byCat.get(i.category) ?? 0) + 1);
  const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = cats[0]?.[1] ?? 1;
  const since = daysSince(issues.map((i) => i.createdAt));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HighSchool",
    name: school.name,
    address: { "@type": "PostalAddress", streetAddress: school.address ?? undefined, postalCode: school.postalCode, addressLocality: school.city, addressCountry: "FR" },
    geo: { "@type": "GeoCoordinates", latitude: school.latitude, longitude: school.longitude },
  };

  return (
    <div className="container-page pt-6 md:pt-8">
      <TrackView event="school_view" props={{ school: school.id }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Breadcrumb
        items={[
          { label: "Tous les lycées", href: "/lycees" },
          // Paris : le département et la commune portent le même nom, un seul niveau suffit.
          ...(place && place.department !== place.name ? [{ label: place.department, href: `/departement/${place.departmentSlug}` }] : []),
          ...(place ? [{ label: place.name, href: `/ville/${place.slug}` }] : []),
          { label: school.name },
        ]}
      />

      <header className="mt-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-muted">
            {school.type}
            {school.sector ? ` ${school.sector.toLowerCase()}` : ""} · {school.city} ({school.postalCode})
          </p>
          <h1 className="display-m mt-2 md:!text-[56px] md:!leading-[60px]">{school.name}</h1>
          {school.address && (
            <p className="mt-2 text-sm text-ink-muted">
              {school.address}, {school.postalCode} {school.city}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <ShareButton
            title={`${shortSchoolName(school.name)} · Signal Lycées`}
            text="Ce qui se passe dans ton lycée mérite d’être entendu. Signale-le anonymement :"
          />
          <ButtonLink href={`/signaler?lycee=${school.slug}`} className="max-md:hidden">
            Signaler un problème
          </ButtonLink>
        </div>
      </header>

      {mobilization && (
        <div className="mt-6">
          <MobilizationBanner m={mobilization} />
        </div>
      )}

      <div className="mt-8">
        <StatCounters
          items={[
            { value: active.length, label: plural(active.length, "problème actif", "problèmes actifs"), tone: "signal" },
            { value: confirmations, label: plural(confirmations, "confirmation") },
            { value: resolved.length, label: plural(resolved.length, "problème résolu", "problèmes résolus"), tone: "resolved" },
            { value: since, label: since === "—" ? "aucun signalement pour l’instant" : since === "aujourd’hui" ? "dernier signalement" : "depuis le dernier signalement" },
          ]}
        />
        <p className="mt-3 text-[13px] text-ink-muted">Ces chiffres comptent des signalements de lycéens. Ils ne notent pas l’établissement.</p>
        {!mobilization && (
          <div className="mt-4">
            <ReportMobilization schoolId={school.id} />
          </div>
        )}
      </div>

      <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <IssueList issues={issues} />

        <aside className="grid content-start gap-5">
          <div className="overflow-hidden rounded-[20px] border border-border bg-surface">
            <div className="relative grid h-44 place-items-center bg-land" aria-hidden="true">
              <span className="grid justify-items-center gap-1">
                <span className="block h-5 w-5 rounded-full border-2 border-[var(--marker-ring)] bg-[var(--marker-2)] shadow-marker" />
                <span className="text-xs font-semibold text-ink-muted">{school.city}</span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-4 text-sm">
              <span className="text-ink-muted">
                {school.city}
                {school.department ? ` · ${school.department}` : ""}
              </span>
              <Link href={`/?focus=${school.id}&lat=${school.latitude}&lng=${school.longitude}#carte`} className="link">
                Voir sur la carte
              </Link>
            </div>
          </div>

          {cats.length > 0 && (
            <section className="rounded-[20px] border border-border bg-surface p-5" aria-labelledby="cats-title">
              <h2 id="cats-title" className="font-display text-xl font-bold">
                Problèmes actifs par catégorie
              </h2>
              <ul className="mt-4 grid gap-3">
                {cats.map(([id, n]) => (
                  <li key={id} className="grid grid-cols-[130px_1fr_24px] items-center gap-3 text-sm">
                    <span>
                      <span aria-hidden="true">{category(id).emoji}</span> {category(id).label}
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                      <span className="block h-full rounded-full bg-signal" style={{ width: `${(n / maxCat) * 100}%` }} />
                    </span>
                    <span className="num text-right font-bold">{n}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-[20px] bg-signal-soft p-6">
            <h2 className="font-display text-xl font-bold">Tu vois un problème qui n’est pas listé ?</h2>
            <p className="mt-3 text-[15px]">
              Ça prend moins d’une minute. Si quelqu’un l’a déjà signalé, confirme-le plutôt : plus il y a de confirmations, plus il est
              visible.
            </p>
            <ButtonLink href={`/signaler?lycee=${school.slug}`} block className="mt-5">
              Signaler un problème
            </ButtonLink>
            <TrustLine className="mt-4" link={false} />
          </section>

          <section className="rounded-[20px] border border-border bg-surface p-6">
            <h2 className="font-display text-xl font-bold">Fais-le connaître dans ton lycée</h2>
            <p className="mt-3 text-[15px]">
              Une affiche et des flyers avec le QR code de cette page, prêts à imprimer.
            </p>
            <ButtonLink href={`/affiches/${school.slug}`} variant="secondary" icon="print" block className="mt-5">
              Imprimer une affiche
            </ButtonLink>
          </section>

          <p className="text-[13px] text-ink-muted">
            Les signalements sont publiés anonymement par des lycéens et vérifiés avant publication. Un contenu te semble abusif ? Utilise « Signaler un contenu » sur la
            page du problème, ou <Link href="/contact" className="link">contacte la modération</Link>.
          </p>
        </aside>
      </div>

      {near.length > 0 && (
        <section className="mt-12 grid gap-3" aria-labelledby="near-h">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="near-h" className="font-display text-2xl font-bold">
              Lycées à proximité
            </h2>
            {place && (
              <Link href={`/ville/${place.slug}`} className="link text-[15px]">
                Tous les lycées {inCity(place.name)}
              </Link>
            )}
          </div>
          <PlaceLinkGrid
            items={near.map((n) => ({
              href: `/lycee/${n.slug}`,
              label: shortSchoolName(n.name),
              sub: `${cityLabel(n.city)} · ${n.distanceKm < 1 ? "moins d’1 km" : `${Math.round(n.distanceKm)} km`}`,
              issues: n.issues,
              mobs: n.mob ? 1 : 0,
              mobLabel: "Mobilisation",
            }))}
          />
        </section>
      )}

      <div className="sticky-cta fixed inset-x-0 bottom-0 z-40 border-t border-border bg-paper/95 p-3 backdrop-blur md:hidden">
        <ButtonLink href={`/signaler?lycee=${school.slug}`} block>
          Signaler un problème
        </ButtonLink>
      </div>
    </div>
  );
}
