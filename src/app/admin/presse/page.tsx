import type { Metadata } from "next";
import { requireAdmin } from "@/server/admin/auth";
import { listPress } from "@/server/admin/press";
import { ActionForm } from "../_components/ActionForm";
import { Empty, formatDateTime, PageHeader, Submit } from "../_components/ui";
import { fetchPressAction, publishPressAction, rejectPressAction } from "./actions";

export const metadata: Metadata = { title: "Revue de presse" };
export const dynamic = "force-dynamic";

const pct = (v: number | null) => (v == null ? "?" : `${Math.round(v * 100)} %`);

type Row = Awaited<ReturnType<typeof listPress>>["pending"][number];

function Article({ a }: { a: Row }) {
  return (
    <span className="adm-meta">
      <a href={a.url} className="link" target="_blank" rel="noopener noreferrer">
        {a.title}
      </a>
      <span>{a.source}</span>
      <span className="adm-muted">{formatDateTime(a.publishedAt)}</span>
      {a.citySlug && <span className="adm-mono">{a.citySlug}</span>}
    </span>
  );
}

export default async function PressAdminPage() {
  await requireAdmin();
  const { pending, published, rejected, missing } = await listPress();
  if (missing)
    return (
      <div className="grid gap-4">
        <PageHeader title="Revue de presse" />
        <Empty>
          La base de données n&apos;est pas encore prête : la migration « press_articles » doit être appliquée (prisma migrate deploy). La page
          fonctionnera ensuite sans autre changement.
        </Empty>
      </div>
    );

  return (
    <div className="grid gap-8">
      <PageHeader
        title="Revue de presse"
        sub="Récupérée automatiquement (Google Actualités et quelques flux). Jev publie ce dont il est sûr ; quand il hésite, un second avis (GPT-5 mini) publie ou écarte. N'arrivent ici que les articles qu'aucune IA n'a pu juger (panne), réessayés au passage suivant. Seuls le titre, la source et le lien sont affichés sur le site."
      >
        <ActionForm action={fetchPressAction} className="adm-form">
          <Submit variant="secondary">Récupérer maintenant</Submit>
        </ActionForm>
      </PageHeader>

      <section>
        <h2 className="adm-h2">À vérifier ({pending.length})</h2>
        {pending.length === 0 ? (
          <Empty>Rien en attente.</Empty>
        ) : (
          <ul className="adm-list">
            {pending.map((a) => (
              <li key={a.id} className="adm-row" style={{ gap: "var(--space-2)" }}>
                <Article a={a} />
                <p className="m-0 adm-small adm-muted">
                  {a.reason} · sujet lycées {pct(a.relevance)} · sensible {pct(a.sensitive)} · hors sujet {pct(a.offTopic)}
                </p>
                <div className="adm-actions">
                  <ActionForm action={publishPressAction} className="adm-form">
                    <input type="hidden" name="id" value={a.id} />
                    <Submit>Publier</Submit>
                  </ActionForm>
                  <ActionForm action={rejectPressAction} className="adm-form">
                    <input type="hidden" name="id" value={a.id} />
                    <Submit variant="secondary">Écarter</Submit>
                  </ActionForm>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="adm-h2">Publiés récemment</h2>
        {published.length === 0 ? (
          <Empty>Aucun article publié.</Empty>
        ) : (
          <ul className="adm-list">
            {published.map((a) => (
              <li key={a.id} className="adm-row" style={{ gap: "var(--space-2)" }}>
                <Article a={a} />
                <ActionForm action={rejectPressAction} className="adm-form">
                  <input type="hidden" name="id" value={a.id} />
                  <Submit variant="secondary">Retirer</Submit>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </section>

      {rejected.length > 0 && (
        <section>
          <h2 className="adm-h2">Écartés récemment</h2>
          <ul className="adm-list">
            {rejected.map((a) => (
              <li key={a.id} className="adm-row" style={{ gap: "var(--space-2)" }}>
                <Article a={a} />
                <p className="m-0 adm-small adm-muted">{a.reason ?? "Écarté"}</p>
                <ActionForm action={publishPressAction} className="adm-form">
                  <input type="hidden" name="id" value={a.id} />
                  <Submit variant="secondary">Publier quand même</Submit>
                </ActionForm>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
