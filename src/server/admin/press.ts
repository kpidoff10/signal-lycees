// Revue de presse : articles que Jev n'a pas su trancher, publication ou refus par la modération.
import "server-only";
import { prisma } from "@/lib/db";
import { runPressJob } from "../press";
import { AdminError } from "./forms";
import { adminLog } from "./log";

export async function listPress() {
  try {
    return { ...(await loadPress()), missing: false };
  } catch (e) {
    // Table absente tant que la migration press_articles n'est pas appliquée.
    console.error("admin press", e instanceof Error ? e.message.slice(0, 200) : e);
    return { pending: [], published: [], rejected: [], missing: true };
  }
}

async function loadPress() {
  const [pending, published, rejected] = await Promise.all([
    prisma.pressArticle.findMany({ where: { status: "PENDING" }, orderBy: { publishedAt: "desc" }, take: 100 }),
    prisma.pressArticle.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 40 }),
    prisma.pressArticle.findMany({ where: { status: "REJECTED" }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  return { pending, published, rejected };
}

export async function setPressStatus(adminId: string, id: string, status: "PUBLISHED" | "REJECTED") {
  await prisma.$transaction(async (tx) => {
    const a = await tx.pressArticle.findUnique({ where: { id }, select: { status: true } });
    if (!a) throw new AdminError("Article introuvable.");
    await tx.pressArticle.update({ where: { id }, data: { status, reviewedAt: new Date() } });
    await adminLog(tx, {
      adminId,
      action: status === "PUBLISHED" ? "PRESS_PUBLISH" : "PRESS_REJECT",
      targetType: "PressArticle",
      targetId: id,
      before: { status: a.status },
      after: { status },
    });
  });
}

export async function fetchPressNow(adminId?: string) {
  return runPressJob(new Date(), "MANUAL", adminId);
}
