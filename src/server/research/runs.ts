// Historique des imports (ImportRun) : un passage = une ligne, ouverte au départ, fermée à la fin.
// Sans « server-only » : utilisé aussi par les scripts en ligne de commande (base passée en paramètre).
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

type Kind = "RESEARCH" | "PRESS" | "FILE";
type Trigger = "AUTO" | "MANUAL" | "CLI";

export async function startRun(db: PrismaClient, data: { kind: Kind; trigger: Trigger; label: string; adminId?: string | null }) {
  return db.importRun.create({ data: { ...data, adminId: data.adminId ?? null }, select: { id: true } });
}

export async function finishRun(
  db: PrismaClient,
  id: string,
  data: { ok: boolean; stats?: Prisma.InputJsonValue; details?: Prisma.InputJsonValue; error?: string },
) {
  await db.importRun.update({
    where: { id },
    data: { status: data.ok ? "OK" : "ERROR", stats: data.stats, details: data.details, error: data.error?.slice(0, 500), finishedAt: new Date() },
  });
}

/** Exécute `fn` en l'inscrivant dans l'historique ; une erreur est notée puis relancée. */
export async function withRun<T>(
  db: PrismaClient,
  meta: { kind: Kind; trigger: Trigger; label: string; adminId?: string | null },
  fn: () => Promise<T>,
  summarize: (r: T) => { stats?: Prisma.InputJsonValue; details?: Prisma.InputJsonValue },
): Promise<T> {
  const run = await startRun(db, meta).catch(() => null); // l'historique ne doit jamais bloquer un import
  try {
    const r = await fn();
    if (run) await finishRun(db, run.id, { ok: true, ...summarize(r) }).catch(() => null);
    return r;
  } catch (e) {
    if (run) await finishRun(db, run.id, { ok: false, error: e instanceof Error ? e.message : String(e) }).catch(() => null);
    throw e;
  }
}
