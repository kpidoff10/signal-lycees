import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { publicEnv } from "@/lib/env";

export const revalidate = 86400;

// Sitemap : pages publiques + fiches de tous les lycées ouverts (~5 600 URL).
// Les problèmes individuels ne sont pas indexés.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl.replace(/\/$/, "");
  const schools = await prisma.school.findMany({ where: { isOpen: true }, select: { slug: true, updatedAt: true } });
  const statics = ["", "/signaler", "/comment-ca-marche", "/regles", "/aide", "/confidentialite", "/cgu", "/mentions-legales", "/contact"];
  return [
    ...statics.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.5 })),
    ...schools.map((s) => ({ url: `${base}/lycee/${s.slug}`, lastModified: s.updatedAt, changeFrequency: "daily" as const, priority: 0.7 })),
  ];
}
