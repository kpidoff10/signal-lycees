import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/places/Breadcrumb";
import { PlaceLinkGrid, SchoolList } from "@/components/places/PlaceLists";
import { ButtonLink } from "@/components/ui/Button";
import { formatNumber, plural } from "@/lib/format";
import { activityBySchool, directory, totals } from "@/server/places";

export const revalidate = 600;

export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const [dir, activity] = await Promise.all([directory(), activityBySchool()]);
  const dept = dir.departmentBySlug.get(slug);
  if (!dept) return null;
  const schools = dept.cities.flatMap((c) => c.schools);
  return { dept, schools, activity, t: totals(schools, activity) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load((await params).slug);
  if (!data) return { title: "Département introuvable" };
  const { dept, t } = data;
  const title = t.mobs
    ? `${dept.name} : ${t.mobs} ${plural(t.mobs, "lycée mobilisé", "lycées mobilisés")}, blocus et problèmes signalés`
    : `${dept.name} : lycées, problèmes signalés et mobilisations`;
  return {
    title,
    description: `Les ${t.schools} lycées du département ${dept.name} (${dept.region}) : problèmes signalés anonymement par les élèves${
      t.mobs ? `, ${t.mobs} ${plural(t.mobs, "mobilisation", "mobilisations")} en cours` : ""
    }. Signale ce qui ne va pas dans ton lycée, gratuitement et sans compte.`,
    alternates: { canonical: `/departement/${dept.slug}` },
  };
}

export default async function DepartementPage({ params }: Props) {
  const data = await load((await params).slug);
  if (!data) notFound();
  const { dept, schools, activity, t } = data;
  const mobilized = schools.filter((s) => activity.get(s.id)?.mob);
  const single = dept.cities.length === 1;

  return (
    <div className="container-page grid gap-8 py-6 md:py-10">
      <div className="grid gap-3">
        <Breadcrumb items={[{ label: "Tous les lycées", href: "/lycees" }, { label: dept.name }]} />
        <p className="eyebrow">Lycées · {dept.region}</p>
        <h1 className="display-m">{dept.name}</h1>
        <p className="max-w-[680px] text-ink-muted">
          {formatNumber(t.schools)} {plural(t.schools, "lycée")} dans {formatNumber(dept.cities.length)}{" "}
          {plural(dept.cities.length, "commune")}
          {t.issues ? `, ${formatNumber(t.issues)} ${plural(t.issues, "problème signalé", "problèmes signalés")} par les élèves` : ""}
          {t.mobs ? ` et ${formatNumber(t.mobs)} ${plural(t.mobs, "lycée mobilisé", "lycées mobilisés")} en ce moment` : ""}.
        </p>
      </div>

      {mobilized.length > 0 && !single && (
        <section className="grid gap-3">
          <h2 className="font-display text-2xl font-bold">Mobilisations en cours</h2>
          <SchoolList schools={mobilized} activity={activity} showCity />
        </section>
      )}

      {single ? (
        <section className="grid gap-3">
          <h2 className="font-display text-2xl font-bold">Les lycées</h2>
          <SchoolList schools={schools} activity={activity} showCity />
        </section>
      ) : (
        <section className="grid gap-3">
          <h2 className="font-display text-2xl font-bold">Par commune</h2>
          <PlaceLinkGrid
            items={dept.cities.map((c) => {
              const ct = totals(c.schools, activity);
              return { href: `/ville/${c.slug}`, label: c.name, sub: `${ct.schools} ${plural(ct.schools, "lycée")}`, issues: ct.issues, mobs: ct.mobs };
            })}
          />
        </section>
      )}

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
