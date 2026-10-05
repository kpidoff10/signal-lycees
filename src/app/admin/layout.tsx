import type { Metadata } from "next";
import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/server/admin/auth";
import { syncState } from "@/server/admin/imports";
import { queueCounts } from "@/server/admin/moderation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { AdminNav } from "./_components/AdminNav";
import { SyncBanner } from "./_components/SyncBanner";
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
        prisma.pressArticle.count({ where: { status: "PENDING" } }).catch(() => 0),
      ]).then(([q, r, m, p]) => ({
        queue: q.total,
        requests: r,
        mobilizations: m,
        press: p,
      }))
    : null;

  if (!session || !counts) return <div className="adm container-page">{children}</div>;
  const sync = await syncState().catch(() => ({ running: [], finished: [] }));

  const logoutForm = (
    <form action={logoutAction}>
      <button type="submit" className="adm-logout">
        <Icon name="logout" size={16} />
        <span className="adm-logout-label">Se déconnecter</span>
      </button>
    </form>
  );

  return (
    <div className="adm adm-shell">
      <aside className="adm-side">
        <div className="adm-brand-row">
          <Link href="/admin" className="adm-brand">
            <span className="adm-brand-dot" aria-hidden="true" />
            Signal Lycées
            <span className="adm-brand-tag">admin</span>
          </Link>
        </div>
        <AdminNav
          counts={counts}
          menuFooter={
            <>
              {logoutForm}
              <Link href="/" className="adm-small adm-muted adm-site-link">
                Voir le site public
              </Link>
            </>
          }
        />
        <div className="adm-side-foot">
          <span className="adm-user">
            <span className="adm-avatar" aria-hidden="true">
              {session.username.slice(0, 1).toUpperCase()}
            </span>
            <span>
              <b>{session.username}</b>
              <span className="adm-small adm-muted">{session.role === "ADMIN" ? "Administrateur" : "Modérateur"}</span>
            </span>
          </span>
          {logoutForm}
          <Link href="/" className="adm-small adm-muted adm-site-link">
            Voir le site public
          </Link>
        </div>
      </aside>
      <main className="adm-main">
        <SyncBanner initial={{ running: sync.running, finished: [] }} />
        {children}
      </main>
    </div>
  );
}
