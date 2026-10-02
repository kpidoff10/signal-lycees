import type { Metadata } from "next";
import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/server/admin/auth";
import { queueCounts } from "@/server/admin/moderation";
import { AdminNav } from "./_components/AdminNav";
import { logoutAction } from "./actions";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Admin | Signal Lycées" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Le layout n'affiche que la navigation : chaque page et chaque action appelle requireAdmin().
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  const counts = session
    ? await Promise.all([
        queueCounts(),
        prisma.privacyRequest.count({ where: { handled: false } }),
        prisma.mobilization.count({ where: { status: "PENDING", expiresAt: { gt: new Date() } } }),
      ]).then(([q, r, m]) => ({
        queue: q.total,
        requests: r,
        mobilizations: m,
      }))
    : null;

  return (
    <div className="adm container-page">
      {session && counts && (
        <>
          <div className="adm-bar">
            <span>
              Connecté : <b>{session.username}</b> ({session.role === "ADMIN" ? "administrateur" : "modérateur"})
            </span>
            <form action={logoutAction} className="ml-auto">
              <button type="submit" className="sl-btn sl-btn-ghost sl-btn-sm">
                Se déconnecter
              </button>
            </form>
          </div>
          <AdminNav counts={counts} />
        </>
      )}
      {children}
    </div>
  );
}
