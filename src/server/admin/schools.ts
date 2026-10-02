// Gestion des lycées.
import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { normalize } from "@/lib/text";
import { AdminError, PAGE_SIZE } from "./forms";
import { adminLog } from "./log";

export interface SchoolFilters {
  q: string;
  region?: string;
  academy?: string;
  page: number;
}

export async function schoolFacets() {
  const [regions, academies] = await Promise.all([
    prisma.school.findMany({ distinct: ["region"], select: { region: true }, orderBy: { region: "asc" } }),
    prisma.school.findMany({
      distinct: ["academy"],
      where: { academy: { not: null } },
      select: { academy: true },
      orderBy: { academy: "asc" },
    }),
  ]);
  return { regions: regions.map((r) => r.region), academies: academies.map((a) => a.academy!).filter(Boolean) };
}

export async function listSchools(f: SchoolFilters) {
  const q = normalize(f.q);
  const where: Prisma.SchoolWhereInput = {
    ...(f.region ? { region: f.region } : {}),
    ...(f.academy ? { academy: f.academy } : {}),
    ...(q
      ? {
          OR: [
            { searchText: { contains: q } },
            { uai: { equals: f.q.toUpperCase() } },
            { postalCode: { startsWith: f.q } },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.school.count({ where }),
    prisma.school.findMany({
      where,
      orderBy: [{ name: "asc" }, { city: "asc" }],
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, uai: true, name: true, city: true, postalCode: true, region: true, academy: true, isOpen: true, _count: { select: { issues: true } } },
    }),
  ]);
  return { total, items, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export function getSchool(id: string) {
  return prisma.school.findUnique({ where: { id }, include: { _count: { select: { issues: true } } } });
}

export interface SchoolEdit {
  name: string;
  address?: string;
  postalCode: string;
  city: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
}

export async function updateSchool(adminId: string, id: string, edit: SchoolEdit) {
  await prisma.$transaction(async (tx) => {
    const school = await tx.school.findUnique({ where: { id } });
    if (!school) throw new AdminError("Lycée introuvable.");
    const before = {
      name: school.name,
      address: school.address,
      postalCode: school.postalCode,
      city: school.city,
      latitude: school.latitude,
      longitude: school.longitude,
      isOpen: school.isOpen,
    };
    const after = { ...edit, address: edit.address ?? null };
    await tx.school.update({
      where: { id },
      data: { ...after, searchText: normalize(`${edit.name} ${edit.city} ${edit.postalCode}`) },
    });
    await adminLog(tx, { adminId, action: "SCHOOL_UPDATE", targetType: "School", targetId: id, before, after });
  });
}
