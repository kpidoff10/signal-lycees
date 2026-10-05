// Recherche automatique des lycées mobilisés du jour (deux fois par jour, ou bouton de l'admin).
// Les lycées trouvés arrivent À VALIDER dans /admin/mobilisations (lot « recherche-<date> »), publiables d'un clic :
// une recherche web peut se tromper d'homonyme, la modération garde la main.
import "server-only";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { expiryFor, startOfDay } from "@/lib/mobilization";
import { parisDay } from "@/lib/traffic";
import { notify } from "../notify";
import { isSecondOpinionEnabled } from "../settings";
import { researchMobilizations, type ResearchResult } from "./core";
import { withRun } from "./runs";
import { verifyPendingMobilizations, type VerifyStats } from "./verify";

export const researchBatch = (date: string) => `recherche-${date}`;

export type ResearchJobResult = ResearchResult & { date: string; created: number; verified: VerifyStats | null };

/** Une recherche déjà en cours depuis moins de 10 minutes : on n'en lance pas une deuxième. */
export async function researchInProgress(): Promise<boolean> {
  const since = new Date(Date.now() - 10 * 60_000);
  return !!(await prisma.importRun.findFirst({ where: { kind: "RESEARCH", status: "RUNNING", startedAt: { gte: since } }, select: { id: true } }));
}

export async function runResearchJob(opts: { trigger: "AUTO" | "MANUAL"; adminId?: string; date?: string }): Promise<ResearchJobResult> {
  const date = opts.date ?? parisDay();
  const label = `Recherche des lycées mobilisés le ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`))}`;
  return withRun(
    prisma,
    { kind: "RESEARCH", trigger: opts.trigger, label, adminId: opts.adminId },
    async () => {
      const r = await researchMobilizations(prisma, { date, regions: true });
      const happenedOn = startOfDay(new Date(`${date}T12:00:00Z`));
      const expiresAt = expiryFor(happenedOn, env().MOBILIZATION_TTL_HOURS);
      let created = 0;
      for (const c of r.candidates) {
        await prisma.mobilization.create({
          data: { schoolId: c.schoolId, origin: "PRESS", status: "PENDING", happenedOn, expiresAt, sourceName: c.sourceName, sourceUrl: c.sourceUrl, importBatch: researchBatch(date) },
        });
        created++;
      }
      // Chaque lycée trouvé est relu par l'IA dans son article (interrupteur au tableau de bord).
      const verified = created && (await isSecondOpinionEnabled("verification")) ? await verifyPendingMobilizations(prisma, { importBatch: researchBatch(date) }) : null;
      const pending = verified ? verified.pending : created;
      if (created) notify({ type: "research", created, published: verified?.published ?? 0, rejected: verified?.rejected ?? 0, pending, unmatched: r.unmatched.length, date });
      return { ...r, date, created, verified };
    },
    (r) => ({
      stats: {
        requests: r.requests,
        failedRequests: r.failedRequests,
        cited: r.cited,
        alreadyKnown: r.alreadyKnown,
        created: r.created,
        unmatched: r.unmatched.length,
        ...(r.verified ? { verifiedPublished: r.verified.published, verifiedRejected: r.verified.rejected, verifiedPending: r.verified.pending } : {}),
      },
      details: { unmatched: r.unmatched },
    }),
  );
}

/** Fait vérifier par l'IA les lycées de recherches et de listes encore en attente (bouton de l'admin). */
export async function runVerifyPendingJob(adminId: string): Promise<VerifyStats> {
  return withRun(
    prisma,
    { kind: "RESEARCH", trigger: "MANUAL", label: "Vérification IA des mobilisations en attente", adminId },
    () => verifyPendingMobilizations(prisma, { batchPrefixes: ["recherche-", "presse-liste", "mobilisations-"] }),
    (v) => ({ stats: { verifiedChecked: v.checked, verifiedPublished: v.published, verifiedRejected: v.rejected, verifiedPending: v.pending } }),
  );
}
