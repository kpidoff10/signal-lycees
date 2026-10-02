// Annuaire des lycées par département et par ville, pour les pages /lycees,
// /departement/[slug] et /ville/[slug]. Les lycées changent rarement : l'annuaire
// est construit une fois puis gardé en mémoire quelques heures.
import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { baseCity, cityLabel, slugify } from "@/lib/places";
import { PUBLIC_ISSUE_WHERE } from "./issues";
import { activeWhere } from "./mobilizations";

export interface DirSchool {
  id: string;
  slug: string;
  name: string;
  type: string;
  sector: string | null;
  /** Nom affichable avec l'arrondissement (« Paris 14e »). */
  cityLabel: string;
  citySlug: string;
}

export interface DirCity {
  slug: string;
  name: string;
  department: string;
  departmentSlug: string;
  schools: DirSchool[];
}

export interface DirDepartment {
  slug: string;
  name: string;
  region: string;
  cities: DirCity[];
  schoolCount: number;
}

export interface Directory {
  departments: DirDepartment[];
  departmentBySlug: Map<string, DirDepartment>;
  cityBySlug: Map<string, DirCity>;
  citySlugBySchool: Map<string, string>;
}

const TTL = 6 * 3600_000;
let memo: { at: number; dir: Promise<Directory> } | null = null;

export function directory(): Promise<Directory> {
  if (!memo || Date.now() - memo.at > TTL) {
    const dir = buildDirectory();
    memo = { at: Date.now(), dir };
    dir.catch(() => (memo = null));
  }
  return memo.dir;
}

async function buildDirectory(): Promise<Directory> {
  const rows = await prisma.school.findMany({
    where: { isOpen: true },
    select: { id: true, slug: true, name: true, type: true, sector: true, city: true, department: true, region: true },
    orderBy: { name: "asc" },
  });

  // Une même commune peut exister dans deux départements (Saint-Denis 93 et 974) :
  // on ajoute alors le département à l'adresse des deux.
  const deptsByCity = new Map<string, Set<string>>();
  for (const r of rows) {
    const key = slugify(baseCity(r.city));
    if (!deptsByCity.has(key)) deptsByCity.set(key, new Set());
    deptsByCity.get(key)!.add(r.department ?? r.region);
  }

  const cityBySlug = new Map<string, DirCity>();
  const departmentBySlug = new Map<string, DirDepartment>();
  const citySlugBySchool = new Map<string, string>();

  for (const r of rows) {
    const deptName = r.department ?? r.region;
    const deptSlug = slugify(deptName);
    const name = baseCity(r.city);
    const base = slugify(name);
    const citySlug = deptsByCity.get(base)!.size > 1 ? `${base}-${deptSlug}` : base;

    let dept = departmentBySlug.get(deptSlug);
    if (!dept) {
      dept = { slug: deptSlug, name: deptName, region: r.region, cities: [], schoolCount: 0 };
      departmentBySlug.set(deptSlug, dept);
    }
    let city = cityBySlug.get(citySlug);
    if (!city) {
      city = { slug: citySlug, name, department: deptName, departmentSlug: deptSlug, schools: [] };
      cityBySlug.set(citySlug, city);
      dept.cities.push(city);
    }
    city.schools.push({ id: r.id, slug: r.slug, name: r.name, type: r.type, sector: r.sector, cityLabel: cityLabel(r.city), citySlug });
    dept.schoolCount++;
    citySlugBySchool.set(r.id, citySlug);
  }

  const collator = new Intl.Collator("fr");
  const departments = [...departmentBySlug.values()].sort((a, b) => collator.compare(a.name, b.name));
  for (const d of departments) d.cities.sort((a, b) => collator.compare(a.name, b.name));
  return { departments, departmentBySlug, cityBySlug, citySlugBySchool };
}

export interface SchoolActivity {
  issues: number;
  mob: boolean;
}

/** Problèmes actifs publiés et mobilisation en cours, pour tous les lycées qui en ont. */
export const activityBySchool = cache(async (): Promise<Map<string, SchoolActivity>> => {
  const [issues, mobs] = await Promise.all([
    prisma.issue.groupBy({ by: ["schoolId"], where: { ...PUBLIC_ISSUE_WHERE, status: { not: "RESOLVED" } }, _count: { _all: true } }),
    prisma.mobilization.findMany({ where: activeWhere(), select: { schoolId: true }, distinct: ["schoolId"] }),
  ]);
  const map = new Map<string, SchoolActivity>();
  for (const g of issues) map.set(g.schoolId, { issues: g._count._all, mob: false });
  for (const m of mobs) map.set(m.schoolId, { issues: map.get(m.schoolId)?.issues ?? 0, mob: true });
  return map;
});

/** Totaux d'un ensemble de lycées. */
export function totals(schools: { id: string }[], activity: Map<string, SchoolActivity>) {
  let issues = 0;
  let mobs = 0;
  for (const s of schools) {
    const a = activity.get(s.id);
    if (!a) continue;
    issues += a.issues;
    if (a.mob) mobs++;
  }
  return { schools: schools.length, issues, mobs };
}
