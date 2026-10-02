import Link from "next/link";
import { requireAdmin } from "@/server/admin/auth";

export const dynamic = "force-dynamic";

export default async function ForbiddenPage() {
  await requireAdmin();
  return (
    <div className="adm-card">
      <h1 className="adm-h1">Accès refusé (403)</h1>
      <p className="adm-sub">Cette action est réservée aux administrateurs.</p>
      <Link href="/admin" className="sl-btn sl-btn-secondary">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
