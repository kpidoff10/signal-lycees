import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/server/rate-limit";
import { ipFingerprint } from "@/server/request";
import { recordPageView } from "@/server/traffic";

// Compteur de visites sans cookie (voir src/server/traffic.ts).
export async function POST(req: NextRequest) {
  try {
    const limit = await rateLimit("map", await ipFingerprint());
    if (limit.ok) {
      const body = (await req.json().catch(() => ({}))) as { p?: unknown; r?: unknown };
      await recordPageView({ path: body.p, referrer: body.r });
    }
  } catch (e) {
    console.error("traffic", e instanceof Error ? e.message : e);
  }
  return new NextResponse(null, { status: 204 });
}
