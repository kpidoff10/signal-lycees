import { NextResponse, type NextRequest } from "next/server";
import { mapSchoolDetail } from "@/server/map";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9]{10,40}$/.test(id)) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  const detail = await mapSchoolDetail(id);
  if (!detail) return NextResponse.json({ error: "Lycée introuvable" }, { status: 404 });
  return NextResponse.json(detail, { headers: { "cache-control": "public, max-age=30, s-maxage=60" } });
}
