// Mobilisations : validation des signalements d'élèves, ajout manuel, arrêt.
import "server-only";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { expiryFor, startOfDay } from "@/lib/mobilization";
import { AdminError } from "./forms";
import { adminLog } from "./log";

const schoolSelect = { select: { name: true, city: true, slug: true } } as const;

export async function listMobilizations() {
  const now = new Date();
  const [pending, active, recent] = await Promise.all([
    prisma.mobilization.findMany({ where: { status: "PENDING", expiresAt: { gt: now } }, orderBy: { createdAt: "asc" }, include: { school: schoolSelect } }),
    prisma.mobilization.findMany({ where: { status: "PUBLISHED", expiresAt: { gt: now } }, orderBy: { happenedOn: "desc" }, include: { school: schoolSelect } }),
    prisma.mobilization.findMany({
      where: { OR: [{ status: "REJECTED" }, { expiresAt: { lte: now } }] },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { school: schoolSelect },
    }),
  ]);
  return { pending, active, recent };
}

async function change(adminId: string, id: string, action: string, data: { status?: "PUBLISHED" | "REJECTED"; expiresAt?: Date; reasons?: string | null }) {
  await prisma.$transaction(async (tx) => {
    const m = await tx.mobilization.findUnique({ where: { id } });
    if (!m) throw new AdminError("Mobilisation introuvable.");
    const updated = await tx.mobilization.update({ where: { id }, data: { ...data, reviewedAt: new Date() } });
    await adminLog(tx, {
      adminId,
      action,
      targetType: "Mobilization",
      targetId: id,
      before: { status: m.status, expiresAt: m.expiresAt },
      after: { status: updated.status, expiresAt: updated.expiresAt },
    });
  });
}

/** Valide une mobilisation signalée par un élève (motifs éventuellement corrigés). */
export async function approveMobilization(adminId: string, id: string, reasons: string | null) {
  const m = await prisma.mobilization.findUnique({ where: { id }, select: { status: true } });
  if (!m || m.status !== "PENDING") throw new AdminError("Cette mobilisation n'est plus en attente.");
  await change(adminId, id, "MOBILIZATION_APPROVE", { status: "PUBLISHED", reasons });
}

/** Publie d'un coup toutes les mobilisations en attente tirées d'un même article (liste de lycées fermés). */
export async function approveMobilizationsFromSource(adminId: string, sourceUrl: string) {
  await prisma.$transaction(async (tx) => {
    const ids = (await tx.mobilization.findMany({ where: { status: "PENDING", origin: "PRESS", sourceUrl }, select: { id: true } })).map((m) => m.id);
    if (!ids.length) throw new AdminError("Plus rien à valider pour cette liste.");
    await tx.mobilization.updateMany({ where: { id: { in: ids } }, data: { status: "PUBLISHED", reviewedAt: new Date() } });
    await adminLog(tx, { adminId, action: "MOBILIZATION_APPROVE_LIST", targetType: "Mobilization", targetId: ids[0], before: { status: "PENDING" }, after: { status: "PUBLISHED", count: ids.length, sourceUrl } });
  });
}

export async function rejectMobilization(adminId: string, id: string) {
  await change(adminId, id, "MOBILIZATION_REJECT", { status: "REJECTED" });
}

/** Arrête l'affichage tout de suite (mobilisation terminée). */
export async function endMobilization(adminId: string, id: string) {
  await change(adminId, id, "MOBILIZATION_END", { expiresAt: new Date() });
}

/** Ajout manuel par la modération (avec source de presse facultative). */
export async function addMobilization(
  adminId: string,
  input: { schoolSlug: string; happenedOn: string; reasons?: string; sourceName?: string; sourceUrl?: string },
) {
  const school = await prisma.school.findUnique({ where: { slug: input.schoolSlug }, select: { id: true } });
  if (!school) throw new AdminError("Lycée introuvable : vérifie l'identifiant (slug) dans l'URL de sa fiche.");
  const happenedOn = startOfDay(new Date(`${input.happenedOn}T12:00:00Z`));
  const expiresAt = expiryFor(happenedOn, env().MOBILIZATION_TTL_HOURS);
  if (expiresAt <= new Date()) throw new AdminError("Cette date est trop ancienne : la mobilisation serait déjà expirée.");
  await prisma.$transaction(async (tx) => {
    const created = await tx.mobilization.create({
      data: {
        schoolId: school.id,
        origin: input.sourceUrl ? "PRESS" : "ADMIN",
        status: "PUBLISHED",
        happenedOn,
        expiresAt,
        reasons: input.reasons || null,
        sourceName: input.sourceName || null,
        sourceUrl: input.sourceUrl || null,
        reviewedAt: new Date(),
      },
    });
    await adminLog(tx, { adminId, action: "MOBILIZATION_ADD", targetType: "Mobilization", targetId: created.id, after: { school: input.schoolSlug, happenedOn, expiresAt } });
  });
}
