// Identités anonymes : aucune donnée nominative n'existe.
import "server-only";
import { prisma } from "@/lib/db";
import { AdminError, PAGE_SIZE } from "./forms";
import { adminLog } from "./log";

export async function listIdentities(f: { page: number; banned?: boolean }) {
  const where = f.banned === undefined ? {} : { banned: f.banned };
  const [total, items] = await Promise.all([
    prisma.anonymousIdentity.count({ where }),
    prisma.anonymousIdentity.findMany({
      where,
      orderBy: { lastSeen: "desc" },
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, banned: true, createdAt: true, lastSeen: true, _count: { select: { issues: true, votes: true } } },
    }),
  ]);
  return { total, items, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function setBanned(adminId: string, identityId: string, banned: boolean) {
  await prisma.$transaction(async (tx) => {
    const identity = await tx.anonymousIdentity.findUnique({ where: { id: identityId }, select: { banned: true } });
    if (!identity) throw new AdminError("Identité introuvable.");
    if (identity.banned === banned) throw new AdminError(banned ? "Déjà bannie." : "Déjà active.");
    await tx.anonymousIdentity.update({ where: { id: identityId }, data: { banned } });
    await adminLog(tx, {
      adminId,
      action: banned ? "IDENTITY_BAN" : "IDENTITY_UNBAN",
      targetType: "AnonymousIdentity",
      targetId: identityId,
      before: { banned: identity.banned },
      after: { banned },
    });
  });
}
