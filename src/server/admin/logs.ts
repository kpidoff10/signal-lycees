import "server-only";
import { prisma } from "@/lib/db";
import { PAGE_SIZE } from "./forms";
import type { LogTarget } from "./log";

export async function listLogs(f: { page: number; targetType?: LogTarget }) {
  const where = f.targetType ? { targetType: f.targetType } : {};
  const [total, items] = await Promise.all([
    prisma.adminLog.count({ where }),
    prisma.adminLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, action: true, targetType: true, targetId: true, before: true, after: true, createdAt: true, admin: { select: { username: true } } },
    }),
  ]);
  return { total, items, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
