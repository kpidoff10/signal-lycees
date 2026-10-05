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

export interface SyncState {
  running: { id: string; kind: string; label: string; startedAt: string }[];
  /** Passages terminés dans les 2 dernières minutes (pour annoncer le résultat). */
  finished: { id: string; kind: string; label: string; status: string; stats: unknown; finishedAt: string }[];
}

/** Synchronisations en cours (au plus 10 min : au-delà, un passage resté « en cours » a planté). */
export async function syncState(now = new Date()): Promise<SyncState> {
  const [running, finished] = await Promise.all([
    prisma.importRun.findMany({ where: { status: "RUNNING", startedAt: { gte: new Date(now.getTime() - 10 * 60_000) } }, orderBy: { startedAt: "asc" } }),
    prisma.importRun.findMany({ where: { status: { not: "RUNNING" }, finishedAt: { gte: new Date(now.getTime() - 2 * 60_000) } }, orderBy: { finishedAt: "desc" }, take: 3 }),
  ]);
  return {
    running: running.map((r) => ({ id: r.id, kind: r.kind, label: r.label, startedAt: r.startedAt.toISOString() })),
    finished: finished.map((r) => ({ id: r.id, kind: r.kind, label: r.label, status: r.status, stats: r.stats, finishedAt: r.finishedAt!.toISOString() })),
  };
}
