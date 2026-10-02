import "server-only";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { expiryFor } from "@/lib/mobilization";
import { runRules } from "./moderation/rules";
import { notify } from "./notify";

export interface ActiveMobilization {
  happenedOn: Date;
  origin: "STUDENT" | "PRESS" | "ADMIN";
  reasons: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
}

export const activeWhere = (now = new Date()) => ({ status: "PUBLISHED" as const, expiresAt: { gt: now } });

/** Mobilisation active la plus récente de chaque lycée. */
export async function activeMobilizations(schoolIds?: string[]): Promise<Map<string, ActiveMobilization>> {
  const rows = await prisma.mobilization.findMany({
    where: { ...activeWhere(), ...(schoolIds ? { schoolId: { in: schoolIds } } : {}) },
    orderBy: { happenedOn: "desc" },
    select: { schoolId: true, happenedOn: true, origin: true, reasons: true, sourceName: true, sourceUrl: true },
  });
  const map = new Map<string, ActiveMobilization>();
  for (const r of rows) if (!map.has(r.schoolId)) map.set(r.schoolId, r);
  return map;
}

export type ReportMobilizationResult = { ok: true; status: "pending" | "already_active" | "already_reported" } | { ok: false; error: string };

/**
 * Un élève signale une mobilisation : elle n'apparaît qu'après validation par la modération.
 * Les motifs sont facultatifs et ne doivent viser personne (revus avant publication).
 */
export async function reportMobilization(input: { identityId: string; schoolId: string; happenedOn: Date; reasons?: string }): Promise<ReportMobilizationResult> {
  const school = await prisma.school.findUnique({ where: { id: input.schoolId }, select: { id: true } });
  if (!school) return { ok: false, error: "Lycée introuvable." };
  const active = await prisma.mobilization.findFirst({ where: { schoolId: input.schoolId, ...activeWhere(), happenedOn: { gte: input.happenedOn } } });
  if (active) return { ok: true, status: "already_active" };
  const mine = await prisma.mobilization.findFirst({
    where: { schoolId: input.schoolId, reporterId: input.identityId, createdAt: { gte: new Date(Date.now() - 24 * 3600_000) } },
  });
  if (mine) return { ok: true, status: "already_reported" };

  const reasons = input.reasons?.trim() || null;
  const hits = reasons ? runRules("", reasons) : [];
  const created = await prisma.mobilization.create({
    data: {
      schoolId: input.schoolId,
      origin: "STUDENT",
      status: "PENDING",
      happenedOn: input.happenedOn,
      expiresAt: expiryFor(input.happenedOn, env().MOBILIZATION_TTL_HOURS),
      reasons,
      reporterId: input.identityId,
    },
  });
  notify({ type: "mobilization", mobilizationId: created.id, flagged: hits.some((h) => h.level !== "soft") });
  return { ok: true, status: "pending" };
}
