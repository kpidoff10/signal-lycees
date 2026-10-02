import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/server/rate-limit";
import { ipFingerprint } from "@/server/request";
import { nearbySchools, withActivity } from "@/server/schools";

const query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

// La position n'est jamais stockée ni journalisée : elle sert uniquement à trier les lycées par distance.
export async function GET(req: NextRequest) {
  const parsed = query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Position invalide" }, { status: 400 });
  const limit = await rateLimit("search", await ipFingerprint());
  if (!limit.ok) return NextResponse.json({ error: "Trop de recherches, patiente un peu." }, { status: 429 });
  const schools = await withActivity(await nearbySchools(parsed.data.lat, parsed.data.lng));
  return NextResponse.json({ schools }, { headers: { "cache-control": "private, no-store" } });
}
