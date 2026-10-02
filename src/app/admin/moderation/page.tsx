import type { Metadata } from "next";
import { requireAdmin } from "@/server/admin/auth";
import { first, pageSchema, type SearchParams } from "@/server/admin/forms";
import { getQueuePage } from "@/server/admin/moderation";
import { Pagination } from "../_components/Pagination";
import { Empty, PageHeader } from "../_components/ui";
import { QueueCard } from "./QueueCard";

export const metadata: Metadata = { title: "Modération" };
export const dynamic = "force-dynamic";

export default async function ModerationPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const page = pageSchema.parse(first((await searchParams).page));
  const q = await getQueuePage(page);

  return (
    <div className="adm-stack">
      <PageHeader
        title="File de modération"
        sub={
          <>
            {q.total.toLocaleString("fr-FR")} élément(s){q.urgent > 0 && <b className="text-signal-ink"> dont {q.urgent} urgent(s)</b>}. Ordre :
            urgents, priorité élevée, publiés signalés, puis le reste du plus ancien au plus récent.
          </>
        }
      />
      {q.items.length === 0 ? (
        <Empty>La file est vide.</Empty>
      ) : (
        q.items.map((item) => <QueueCard key={item.id} item={item} />)
      )}
      {q.total > 0 && <Pagination page={page} pageCount={q.pageCount} total={q.total} basePath="/admin/moderation" params={{}} />}
    </div>
  );
}
