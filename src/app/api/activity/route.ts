import { NextResponse } from "next/server";
import { todayActivity } from "@/server/stats";

export async function GET() {
  return NextResponse.json(await todayActivity(), { headers: { "cache-control": "public, max-age=30, s-maxage=60" } });
}
