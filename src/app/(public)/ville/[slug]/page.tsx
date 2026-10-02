import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/places/Breadcrumb";
import { SchoolList } from "@/components/places/PlaceLists";
import { ButtonLink } from "@/components/ui/Button";
import { formatNumber, plural } from "@/lib/format";
import { inCity } from "@/lib/places";
import { activityBySchool, directory, totals } from "@/server/places";

export const revalidate = 600;

export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const [dir, activity] = await Promise.all([directory(), activityBySchool()]);
  const city = dir.cityBySlug.get(slug);
  if (!city) return null;
  return { city, activity, t: totals(city.schools, activity) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load((await params).slug);
  if (!data) return { title: "Commune introuvable" };
  const { city, t } = data;
  const where = inCity(city.name);
  const title = t.mobs
    ? `Lycées ${where} : ${t.mobs} ${plural(t.mobs, "mobilisé", "mobilisés")}, blocus et problèmes signalés`
    : `Lycées ${where} : problèmes signalés et mobilisations`;
  return {
    title,
    description: `${t.schools} ${plural(t.schools, "lycée")} ${where} (${city.department}) : problèmes signalés anonymement par les élèves${
      t.mobs ? ` et mobilisations en cours` : ""
    }. Signale ce qui ne va pas dans ton lycée, gratuitement et sans compte.`,
    alternates: { canonical: `/ville/${city.slug}` },
  };
}

export default async function VillePage({ params }: Props) {
  const data = await load((await params).slug);
  if (!data) notFound();
  const { city, activity, t } = data;
  const arrondissements = new Set(city.schools.map((s) => s.cityLabel)).size > 1;

  return (
    <div className="container-page grid gap-8 py-6 md:py-10">
      <div className="grid gap-3">
        <Breadcrumb
          items={[
            { label: "Tous les lycées", href: "/lycees" },
            ...(city.department !== city.name ? [{ label: city.department, href: `/departement/${city.departmentSlug}` }] : []),
            { label: city.name },
          ]}
        />
        <p className="eyebrow">Lycées · {city.department}</p>
        <h1 className="display-m">Lycées {inCity(city.name)}</h1>
        <p className="max-w-[680px] text-ink-muted">
          {formatNumber(t.schools)} {plural(t.schools, "lycée")}
          {t.issues ? `, ${formatNumber(t.issues)} ${plural(t.issues, "problème signalé", "problèmes signalés")} par les élèves` : ""}
          {t.mobs ? ` et ${formatNumber(t.mobs)} ${plural(t.mobs, "lycée mobilisé", "lycées mobilisés")} en ce moment` : ""}. Choisis ton lycée
          pour voir ce qui y est signalé, confirmer un problème ou en signaler un.
        </p>
      </div>

      <SchoolList schools={city.schools} activity={activity} showCity={arrondissements} />

      <section className="rounded-[20px] bg-signal-soft p-6">
        <h2 className="font-display text-xl font-bold">Un problème dans ton lycée ?</h2>
        <p className="mt-2 text-[15px]">Signale-le anonymement : pas de compte, pas d’e-mail, et chaque signalement est vérifié avant publication.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/signaler">Signaler un problème</ButtonLink>
          <ButtonLink href="/affiches" variant="secondary" icon="print">
            Affiches à imprimer
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
