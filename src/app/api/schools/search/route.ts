import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/server/rate-limit";
import { ipFingerprint } from "@/server/request";
import { normalize } from "@/lib/text";
import { citiesWithActivity, schoolsOfCity, searchCities, searchSchools, withActivity } from "@/server/schools";

const query = z.object({
  q: z.string().max(100).default(""),
  cities: z.enum(["0", "1"]).default("0"),
});

export async function GET(req: NextRequest) {
  const parsed = query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const limit = await rateLimit("search", await ipFingerprint());
  if (!limit.ok) return NextResponse.json({ error: "Trop de recherches, patiente un peu." }, { status: 429 });

  const { q, cities } = parsed.data;
  const [found, rawCities] = await Promise.all([searchSchools(q), searchCities(q)]);
  // La recherche est exactement une ville : ses lycées, ceux qui ont de l'activité en premier.
  const exactCity = rawCities.find((c) => normalize(c.city) === normalize(q));
  const rawSchools = exactCity ? await schoolsOfCity(exactCity.city) : found;
  const [schools, cityHits] = await Promise.all([withActivity(rawSchools), cities === "1" ? citiesWithActivity(rawCities) : Promise.resolve([])]);
  return NextResponse.json(
    { schools, cities: cityHits },
    { headers: { "cache-control": "public, max-age=30, s-maxage=60" } },
  );
}
