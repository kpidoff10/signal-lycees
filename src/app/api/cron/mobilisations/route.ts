import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/server/cron";
import { researchInProgress, runResearchJob } from "@/server/research/job";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Recherche des lycées mobilisés du jour (GitHub Actions, deux fois par jour).
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (await researchInProgress()) return NextResponse.json({ skipped: "Une recherche est déjà en cours." });
  const r = await runResearchJob({ trigger: "AUTO" });
  return NextResponse.json({ date: r.date, requests: r.requests, failed: r.failedRequests, created: r.created, alreadyKnown: r.alreadyKnown, unmatched: r.unmatched.length });
}
