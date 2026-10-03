import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/server/cron";
import { runIndexNowJob } from "@/server/indexnow";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await runIndexNowJob());
}
