import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpResources } from "@/app/(public)/(info)/aide/HelpResources";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { DeleteOwnIssue } from "@/components/report/DeleteOwnIssue";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/format";
import { sha256 } from "@/server/crypto";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Suivi de mon signalement", robots: { index: false, follow: false }, referrer: "no-referrer" };

const STATUS: Record<string, { label: string; text: string }> = {
  PENDING: { label: "En vérification", text: "Ton signalement est en cours de vérification." },
  MANUAL_REVIEW: { label: "En vérification", text: "Une personne de l’équipe va relire ton signalement avant publication." },
  AUTO_APPROVED: { label: "Publié", text: "Ton signalement est publié." },
  PUBLISHED: { label: "Publié", text: "Ton signalement est publié." },
  REJECTED: { label: "Non publié", text: "Ton signalement n’a pas été publié." },
};

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) notFound();
  const issue = await prisma.issue.findUnique({
    where: { trackingTokenHash: sha256(token) },
    select: {
      id: true,
      title: true,
      category: true,
      moderationStatus: true,
      status: true,
      upCount: true,
      createdAt: true,
      school: { select: { name: true, slug: true } },
      decisions: { orderBy: { createdAt: "desc" }, take: 1, select: { publicReason: true } },
      analyses: { orderBy: { createdAt: "desc" }, take: 1, select: { result: true } },
    },
  });
  if (!issue) notFound();
  const s = STATUS[issue.moderationStatus] ?? STATUS.PENDING!;
  const published = issue.moderationStatus === "PUBLISHED" || issue.moderationStatus === "AUTO_APPROVED";
  const showHelp = (issue.analyses[0]?.result as { showHelp?: boolean } | null)?.showHelp === true;

  return (
    <div className="container-page max-w-[720px] pb-20 pt-8 md:pt-12">
      <p className="eyebrow">Suivi de mon signalement</p>
      <h1 className="mt-3 font-display text-[30px] font-bold leading-9 md:text-[40px] md:leading-[46px]">{issue.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
        <CategoryBadge id={issue.category} />
        <span>
          {issue.school.name} · envoyé le {formatDay(issue.createdAt)}
        </span>
      </div>

      <section className="mt-8 grid gap-3 rounded-[20px] border border-border bg-surface p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.06em] text-ink-muted">État</p>
        <p className="font-display text-2xl font-bold">{s.label}</p>
        <p>{s.text}</p>
        {issue.moderationStatus === "REJECTED" && issue.decisions[0]?.publicReason && (
          <p className="rounded-[var(--radius-md)] bg-surface-sunken p-3 text-[15px]">Motif : {issue.decisions[0].publicReason}</p>
        )}
        {published && (
          <Link href={`/probleme/${issue.id}`} className="link">
            Voir le signalement publié
          </Link>
        )}
      </section>

      {showHelp && (
        <section className="mt-8 grid gap-4">
          <h2 className="font-display text-xl font-bold">Besoin de parler à quelqu’un ?</h2>
          <HelpResources />
        </section>
      )}

      <section className="mt-10 grid gap-3">
        <h2 className="font-display text-xl font-bold">Supprimer mon signalement</h2>
        <p className="text-ink-muted">La suppression est définitive : le signalement, ses confirmations et son historique disparaissent.</p>
        <DeleteOwnIssue token={token} schoolSlug={issue.school.slug} />
      </section>
    </div>
  );
}
