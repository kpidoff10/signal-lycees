import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/server/cron";
import { runPressJob } from "@/server/press";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await runPressJob());
}
