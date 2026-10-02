import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/server/rate-limit";
import { ipFingerprint } from "@/server/request";
import { searchCities, searchSchools } from "@/server/schools";

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
  const [schools, cityHits] = await Promise.all([searchSchools(q), cities === "1" ? searchCities(q) : Promise.resolve([])]);
  return NextResponse.json(
    { schools, cities: cityHits },
    { headers: { "cache-control": "public, max-age=60, s-maxage=300" } },
  );
}
