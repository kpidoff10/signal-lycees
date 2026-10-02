// Authentification de l'espace d'administration.
// requireAdmin() doit être appelée au début de CHAQUE page et CHAQUE action admin :
// le layout n'est pas une barrière de sécurité.
import "server-only";
import { cookies } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { AdminRole } from "@/generated/prisma/enums";
import { safeEqual } from "../crypto";
import { rateLimit } from "../rate-limit";
import { ipFingerprint } from "../request";
import { dummyHash, verifyPassword } from "./password";
import { createSessionToken, passwordVersion, SESSION_COOKIE, SESSION_TTL_SEC, verifySessionToken } from "./session";
import { matchTotpStep } from "./totp";

export const LOGIN_PATH = "/admin/connexion";
export const FORBIDDEN_PATH = "/admin/interdit";

export interface AdminSession {
  id: string;
  username: string;
  role: AdminRole;
}

const RANK: Record<AdminRole, number> = { MODERATOR: 1, ADMIN: 2 };

export function hasRole(actual: AdminRole, required: AdminRole): boolean {
  return RANK[actual] >= RANK[required];
}

/** Session courante, ou null (sans redirection). Mémorisée pour la durée de la requête. */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const store = await cookies();
  const payload = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true, role: true, active: true, passwordHash: true },
  });
  if (!admin || !admin.active) return null;
  if (!safeEqual(passwordVersion(admin.passwordHash), payload.pwv)) return null;
  return { id: admin.id, username: admin.username, role: admin.role };
});

/** Exige une session admin (et un rôle minimal). Redirige vers la connexion sinon ; 403 si rôle insuffisant. */
export async function requireAdmin(role: AdminRole = "MODERATOR"): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect(LOGIN_PATH);
  if (!hasRole(session.role, role)) {
    // forbidden() n'est disponible qu'avec experimental.authInterrupts ; sinon page « Accès refusé ».
    if (process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS) forbidden();
    redirect(FORBIDDEN_PATH);
  }
  return session;
}

export type LoginResult = { ok: true } | { ok: false; error: string };

const GENERIC_ERROR = "Identifiants ou code incorrects.";

/** Vérifie identifiant, mot de passe et TOTP éventuel ; pose le cookie de session. */
export async function login(input: { username: string; password: string; code?: string }): Promise<LoginResult> {
  const ipKey = await ipFingerprint();
  const username = input.username.trim().toLowerCase();
  const limit = await rateLimit("adminLogin", ipKey, `user:${username}`);
  if (!limit.ok) return { ok: false, error: "Trop de tentatives. Réessaie dans quelques minutes." };

  const admin = await prisma.adminUser.findUnique({ where: { username } });
  // Toujours un calcul scrypt, même si l'identifiant n'existe pas (pas d'oracle temporel).
  const passwordOk = await verifyPassword(input.password, admin?.passwordHash ?? (await dummyHash()));
  if (!admin || !admin.active || !passwordOk) return { ok: false, error: GENERIC_ERROR };
  let totpStep: number | null = null;
  if (admin.totpSecret) {
    totpStep = matchTotpStep(admin.totpSecret, input.code ?? "");
    // Code invalide, ou déjà utilisé (rejeu).
    if (totpStep === null || (admin.totpLastStep !== null && totpStep <= admin.totpLastStep)) return { ok: false, error: GENERIC_ERROR };
  }

  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date(), ...(totpStep !== null ? { totpLastStep: totpStep } : {}) } });
  await prisma.adminLog.create({ data: { adminId: admin.id, action: "LOGIN", targetType: "AdminUser", targetId: admin.id } });

  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(admin.id, admin.passwordHash), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: SESSION_TTL_SEC,
  });
  return { ok: true };
}

export async function logout() {
  const store = await cookies();
  store.delete({ name: SESSION_COOKIE, path: "/admin" });
}
