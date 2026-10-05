import { NextResponse, type NextRequest } from "next/server";
import { mapQuerySchema } from "@/lib/map-query";
import { mapSchools } from "@/server/map";
import { rateLimit } from "@/server/rate-limit";
import { ipFingerprint } from "@/server/request";

export async function GET(req: NextRequest) {
  const parsed = mapQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Filtres invalides" }, { status: 400 });
  const limit = await rateLimit("map", await ipFingerprint());
  if (!limit.ok) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  const { cats, active, period, mob } = parsed.data;
  const schools = await mapSchools({ cats, activeOnly: active, period, mobs: mob });
  return NextResponse.json(
    { schools },
    { headers: { "cache-control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } },
  );
}
