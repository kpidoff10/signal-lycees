// Historique des imports et état des automatisations (page /admin/imports, tableau de bord).
import "server-only";
import { prisma } from "@/lib/db";

export async function listImportRuns(take = 60) {
  return prisma.importRun.findMany({ orderBy: { startedAt: "desc" }, take });
}

/** Dernier passage de chaque automatisation. */
export async function lastRuns() {
  const [research, press] = await Promise.all([
    prisma.importRun.findFirst({ where: { kind: "RESEARCH" }, orderBy: { startedAt: "desc" } }),
    prisma.importRun.findFirst({ where: { kind: "PRESS" }, orderBy: { startedAt: "desc" } }),
  ]);
  return { research, press };
}
