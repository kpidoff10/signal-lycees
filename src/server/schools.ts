import "server-only";
import { prisma } from "@/lib/db";
import { normalize } from "@/lib/text";

export interface SchoolHit {
  type: "school";
  id: string;
  slug: string;
  name: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export interface CityHit {
  type: "city";
  city: string;
  postalCode: string;
  count: number;
  latitude: number;
  longitude: number;
}

/**
 * Recherche de lycées par nom, ville ou code postal : insensible aux accents,
 * tolérante aux fautes (pg_trgm). Tous les mots doivent apparaître ; sinon repli flou.
 */
export async function searchSchools(raw: string, limit = 8): Promise<SchoolHit[]> {
  const q = normalize(raw).replace(/[^a-z0-9 '-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  if (q.length < 2) return [];
  const tokens = q.split(" ").filter((t) => t.length > 0 && t !== "lycee").slice(0, 6);
  const patterns = (tokens.length ? tokens : [q]).map((t) => `%${t}%`);

  const strict = await prisma.$queryRaw<SchoolHit[]>`
    SELECT 'school' AS type, id, slug, name, city, "postalCode", latitude, longitude
      FROM "School"
     WHERE "isOpen" AND "searchText" LIKE ALL (${patterns}::text[])
     ORDER BY ("postalCode" LIKE ${q + "%"}) DESC, word_similarity(${q}, "searchText") DESC, name
     LIMIT ${limit}`;
  if (strict.length >= limit) return strict;

  const seen = new Set(strict.map((s) => s.id));
  const fuzzy = await prisma.$queryRaw<SchoolHit[]>`
    SELECT 'school' AS type, id, slug, name, city, "postalCode", latitude, longitude
      FROM "School"
     WHERE "isOpen" AND ${q} <% "searchText"
     ORDER BY word_similarity(${q}, "searchText") DESC
     LIMIT ${limit}`;
  return [...strict, ...fuzzy.filter((s) => !seen.has(s.id))].slice(0, limit);
}

/** Villes ayant au moins un lycée (pour centrer la carte). */
export async function searchCities(raw: string, limit = 3): Promise<CityHit[]> {
  const q = normalize(raw).trim().slice(0, 60);
  if (q.length < 2) return [];
  const rows = await prisma.$queryRaw<(Omit<CityHit, "count"> & { count: bigint })[]>`
    SELECT 'city' AS type, city, MIN("postalCode") AS "postalCode", COUNT(*) AS count,
           AVG(latitude) AS latitude, AVG(longitude) AS longitude
      FROM "School"
     WHERE "isOpen" AND (lower(unaccent(city)) LIKE ${q + "%"} OR "postalCode" LIKE ${q + "%"})
     GROUP BY city
     ORDER BY COUNT(*) DESC
     LIMIT ${limit}`;
  return rows.map((r) => ({ ...r, count: Number(r.count), latitude: Number(r.latitude), longitude: Number(r.longitude) }));
}

export interface NearbyHit extends SchoolHit {
  distanceKm: number;
}

/**
 * Lycées les plus proches d'un point. La position reçue est déjà arrondie (~1 km)
 * par le navigateur ; elle n'est ni stockée ni journalisée.
 */
export async function nearbySchools(lat: number, lng: number, limit = 8): Promise<NearbyHit[]> {
  const rows = await prisma.$queryRaw<(Omit<NearbyHit, "distanceKm"> & { distanceKm: number })[]>`
    SELECT 'school' AS type, id, slug, name, city, "postalCode", latitude, longitude,
           6371 * 2 * asin(sqrt(
             power(sin(radians(latitude - ${lat}) / 2), 2) +
             cos(radians(${lat})) * cos(radians(latitude)) * power(sin(radians(longitude - ${lng}) / 2), 2)
           )) AS "distanceKm"
      FROM "School"
     WHERE "isOpen"
       AND latitude BETWEEN ${lat - 1.5} AND ${lat + 1.5}
       AND longitude BETWEEN ${lng - 2.5} AND ${lng + 2.5}
     ORDER BY "distanceKm"
     LIMIT ${limit}`;
  return rows.map((r) => ({ ...r, distanceKm: Number(r.distanceKm) }));
}
