import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { publicEnv } from "@/lib/env";
import { directory } from "@/server/places";

export const revalidate = 86400;

// Sitemap : pages publiques, départements, communes et fiches de tous les lycées ouverts (~7 500 URL).
// Les problèmes individuels ne sont pas indexés.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl.replace(/\/$/, "");
  const [schools, dir] = await Promise.all([
    prisma.school.findMany({ where: { isOpen: true }, select: { slug: true, updatedAt: true } }),
    directory(),
  ]);
  const statics = ["", "/comment-ca-marche", "/regles", "/aide", "/confidentialite", "/cgu", "/mentions-legales", "/contact", "/presse", "/affiches", "/lycees"];
  return [
    ...statics.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.5 })),
    ...dir.departments.map((d) => ({ url: `${base}/departement/${d.slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
    ...[...dir.cityBySlug.values()].map((c) => ({ url: `${base}/ville/${c.slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
    ...schools.map((s) => ({ url: `${base}/lycee/${s.slug}`, lastModified: s.updatedAt, changeFrequency: "daily" as const, priority: 0.7 })),
  ];
}
