import { NextResponse } from "next/server";
import { getAdminSession } from "@/server/admin/auth";
import { syncState } from "@/server/admin/imports";

export const dynamic = "force-dynamic";

// État des synchronisations pour le bandeau de l'admin (sous /admin : le cookie de session n'est envoyé que là).
export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await syncState(), { headers: { "cache-control": "no-store" } });
}
