import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasRole, requireAdmin } from "@/server/admin/auth";
import { idSchema } from "@/server/admin/forms";
import { getSchool } from "@/server/admin/schools";
import { ActionForm } from "../../_components/ActionForm";
import { formatDateTime, PageHeader, Submit } from "../../_components/ui";
import { updateSchoolAction } from "../actions";

export const metadata: Metadata = { title: "Fiche lycée" };
export const dynamic = "force-dynamic";

export default async function SchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const s = await getSchool(id.data);
  if (!s) notFound();
  const canEdit = hasRole(admin.role, "ADMIN");

  return (
    <div className="adm-stack">
      <p className="m-0">
        <Link href="/admin/schools" className="link">
          ← Lycées
        </Link>
      </p>
      <PageHeader title={s.name} sub={`${s.type}${s.sector ? ` · ${s.sector}` : ""}`} />
      <section className="adm-card">
        <dl className="adm-dl">
          <dt>UAI</dt>
          <dd className="adm-mono">{s.uai}</dd>
          <dt>Adresse</dt>
          <dd>
            {s.address ? `${s.address}, ` : ""}
            {s.postalCode} {s.city}
          </dd>
          <dt>Académie</dt>
          <dd>{s.academy ?? "—"}</dd>
          <dt>Département</dt>
          <dd>{s.department ?? "—"}</dd>
          <dt>Région</dt>
          <dd>{s.region}</dd>
          <dt>Coordonnées</dt>
          <dd className="num">
            {s.latitude}, {s.longitude}
          </dd>
          <dt>Ouvert</dt>
          <dd>{s.isOpen ? "Oui" : "Non (masqué de la recherche)"}</dd>
          <dt>Signalements</dt>
          <dd>
            <Link className="link" href={`/admin/issues?q=${encodeURIComponent(s.name)}`}>
              {s._count.issues}
            </Link>
          </dd>
          <dt>Mis à jour</dt>
          <dd>{formatDateTime(s.updatedAt)}</dd>
        </dl>
      </section>

      {canEdit ? (
        <section className="adm-card" aria-labelledby="edit-h">
          <h2 id="edit-h" className="adm-h2">
            Modifier
          </h2>
          <ActionForm action={updateSchoolAction}>
            <input type="hidden" name="schoolId" value={s.id} />
            <label className="adm-label">
              Nom
              <input name="name" className="field" defaultValue={s.name} required maxLength={200} />
            </label>
            <label className="adm-label">
              Adresse
              <input name="address" className="field" defaultValue={s.address ?? ""} maxLength={300} />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="adm-label">
                Code postal
                <input name="postalCode" className="field" defaultValue={s.postalCode} required inputMode="numeric" pattern="\d{5}" />
              </label>
              <label className="adm-label">
                Ville
                <input name="city" className="field" defaultValue={s.city} required maxLength={120} />
              </label>
              <label className="adm-label">
                Latitude
                <input name="latitude" className="field" defaultValue={String(s.latitude)} required inputMode="decimal" />
              </label>
              <label className="adm-label">
                Longitude
                <input name="longitude" className="field" defaultValue={String(s.longitude)} required inputMode="decimal" />
              </label>
            </div>
            <label className="adm-check">
              <input type="checkbox" name="isOpen" defaultChecked={s.isOpen} />
              Établissement ouvert
            </label>
            <div>
              <Submit>Enregistrer</Submit>
            </div>
          </ActionForm>
        </section>
      ) : (
        <p className="adm-small adm-muted">La modification des lycées est réservée aux administrateurs.</p>
      )}
    </div>
  );
}
