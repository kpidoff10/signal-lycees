// IndexNow : prévient Bing (et les moteurs qui partagent le protocole : Yandex, Seznam, Naver…) quand des pages changent.
// La clé est publique par conception : elle est servie à la racine du site pour prouver qu'on en est le propriétaire.
import "server-only";
import { prisma } from "@/lib/db";
import { publicEnv } from "@/lib/env";
import { PUBLIC_ISSUE_WHERE } from "./issues";
import { directory } from "./places";

export const INDEXNOW_KEY = "cb3388073bb53c776497742bf0c03e91";
const DONE_KEY = "indexnowFullSubmitted";

async function submit(urls: string[]) {
  const base = publicEnv.siteUrl.replace(/\/$/, "");
  const host = new URL(base).hostname;
  let sent = 0;
  for (let i = 0; i < urls.length; i += 10_000) {
    const urlList = urls.slice(i, i + 10_000);
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${base}/${INDEXNOW_KEY}.txt`, urlList }),
    });
    if (!res.ok && res.status !== 202) throw new Error(`IndexNow ${res.status}`);
    sent += urlList.length;
  }
  return sent;
}

/** Première fois : toutes les adresses du sitemap. Ensuite : les pages touchées depuis 24 h. */
export async function runIndexNowJob(now = new Date()) {
  if (!publicEnv.siteUrl.startsWith("https://signal-lycees.fr")) return { skipped: "hors production" };
  const base = publicEnv.siteUrl.replace(/\/$/, "");
  const dir = await directory();
  const done = await prisma.appSetting.findUnique({ where: { key: DONE_KEY } });
  let urls: string[];
  if (!done) {
    const schools = await prisma.school.findMany({ where: { isOpen: true }, select: { slug: true } });
    urls = [
      ...["", "/lycees", "/comment-ca-marche", "/regles", "/aide", "/presse", "/actualites", "/affiches", "/contact", "/confidentialite", "/cgu", "/mentions-legales"].map((p) => base + p),
      ...dir.departments.map((d) => `${base}/departement/${d.slug}`),
      ...[...dir.cityBySlug.values()].map((c) => `${base}/ville/${c.slug}`),
      ...schools.map((s) => `${base}/lycee/${s.slug}`),
    ];
  } else {
    const since = new Date(now.getTime() - 26 * 3600_000);
    const [issues, mobs] = await Promise.all([
      prisma.issue.findMany({ where: { ...PUBLIC_ISSUE_WHERE, OR: [{ publishedAt: { gte: since } }, { statusChangedAt: { gte: since } }] }, select: { schoolId: true }, distinct: ["schoolId"] }),
      prisma.mobilization.findMany({ where: { status: "PUBLISHED", OR: [{ createdAt: { gte: since } }, { expiresAt: { gte: since, lte: now } }] }, select: { schoolId: true }, distinct: ["schoolId"] }),
    ]);
    const ids = [...new Set([...issues, ...mobs].map((r) => r.schoolId))];
    if (!ids.length) return { submitted: 0 };
    const schools = await prisma.school.findMany({ where: { id: { in: ids } }, select: { id: true, slug: true } });
    const cities = new Set(schools.map((s) => dir.citySlugBySchool.get(s.id)).filter(Boolean) as string[]);
    const depts = new Set([...cities].map((c) => dir.cityBySlug.get(c)?.departmentSlug).filter(Boolean) as string[]);
    urls = [base, `${base}/lycees`, `${base}/actualites`, `${base}/presse`, ...schools.map((s) => `${base}/lycee/${s.slug}`), ...[...cities].map((c) => `${base}/ville/${c}`), ...[...depts].map((d) => `${base}/departement/${d}`)];
  }
  const submitted = await submit(urls);
  if (!done) await prisma.appSetting.create({ data: { key: DONE_KEY, value: now.toISOString() } });
  return { submitted, full: !done };
}
