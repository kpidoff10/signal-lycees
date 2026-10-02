import type { Metadata } from "next";
import { Breadcrumb } from "@/components/places/Breadcrumb";
import { PlaceLinkGrid } from "@/components/places/PlaceLists";
import { formatNumber, plural } from "@/lib/format";
import { activityBySchool, directory, totals } from "@/server/places";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Tous les lycées de France par département",
  description:
    "Trouve ton lycée par département et par ville : problèmes signalés anonymement par les élèves et mobilisations en cours, partout en France.",
  alternates: { canonical: "/lycees" },
};

export default async function LyceesPage() {
  const [dir, activity] = await Promise.all([directory(), activityBySchool()]);
  const byRegion = new Map<string, typeof dir.departments>();
  for (const d of dir.departments) {
    if (!byRegion.has(d.region)) byRegion.set(d.region, []);
    byRegion.get(d.region)!.push(d);
  }
  const regions = [...byRegion.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr"));
  const all = totals(dir.departments.flatMap((d) => d.cities.flatMap((c) => c.schools)), activity);

  return (
    <div className="container-page grid gap-8 py-6 md:py-10">
      <div className="grid gap-3">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Tous les lycées" }]} />
        <h1 className="display-m">Tous les lycées de France</h1>
        <p className="max-w-[680px] text-ink-muted">
          {formatNumber(all.schools)} lycées, classés par département et par ville. Pour chacun, les problèmes signalés anonymement
          par les élèves et les mobilisations en cours
          {all.mobs ? ` (${formatNumber(all.mobs)} ${plural(all.mobs, "lycée mobilisé", "lycées mobilisés")} en ce moment)` : ""}.
        </p>
      </div>
      {regions.map(([region, depts]) => (
        <section key={region} className="grid gap-3">
          <h2 className="font-display text-2xl font-bold">{region}</h2>
          <PlaceLinkGrid
            items={depts.map((d) => {
              const t = totals(d.cities.flatMap((c) => c.schools), activity);
              return { href: `/departement/${d.slug}`, label: d.name, sub: `${t.schools} ${plural(t.schools, "lycée")}`, issues: t.issues, mobs: t.mobs };
            })}
          />
        </section>
      ))}
    </div>
  );
}
