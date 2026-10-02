import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryBadge, ResolvedBadge } from "@/components/ui/CategoryBadge";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TrackView } from "@/components/ui/TrackView";
import { TrustLine } from "@/components/ui/TrustNote";
import { IssueActions } from "@/components/issue/IssueActions";
import { PressBadge } from "@/components/issue/PressBadge";
import { formatDay, timeAgo } from "@/lib/format";
import { getPublicIssue } from "@/server/issue-page";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

// Les problèmes individuels ne sont pas indexés (seules les fiches lycée le sont).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const issue = await getPublicIssue(id);
  if (!issue) return { title: "Problème introuvable", robots: { index: false } };
  return { title: `${issue.title} — ${issue.school.name}`, robots: { index: false, follow: true } };
}

export default async function IssuePage({ params }: Props) {
  const { id } = await params;
  const issue = await getPublicIssue(id);
  if (!issue) notFound();
  const resolved = issue.status === "RESOLVED";

  return (
    <div className="container-page max-w-[880px] pb-20 pt-6 md:pt-8">
      <TrackView event="issue_view" props={{ category: issue.category }} />
      <Link href={`/lycee/${issue.school.slug}`} className="link inline-flex items-center gap-1 text-sm">
        <Icon name="back" size={16} /> {issue.school.name}
      </Link>

      <article className="mt-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          {resolved && <ResolvedBadge />}
          {issue.status === "POSSIBLY_RESOLVED" && <ResolvedBadge label="Peut-être résolu" />}
          <CategoryBadge id={issue.category} />
          {!issue.source && <span>Signalé {timeAgo(issue.createdAt)}</span>}
          <span aria-hidden="true">·</span>
          <span>
            {issue.school.city} ({issue.school.postalCode})
          </span>
        </div>
        <h1 className="mt-4 font-display text-[30px] font-bold leading-[36px] tracking-[-0.015em] md:text-[40px] md:leading-[46px]">{issue.title}</h1>
        <p className="user-text mt-5 text-[17px] leading-7">{issue.description}</p>
        {issue.source ? (
          <div className="mt-5 grid gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-4 text-[14px]">
            <PressBadge source={issue.source} />
            <p className="text-ink-muted">
              Ce problème n’a pas été déposé par un élève : il est repris d’un article de presse pour faire connaître la situation. Tu es
              dans ce lycée et tu vis la même chose ? Confirme-le ci-dessous.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-ink-muted">Signalement anonyme, vérifié avant publication.</p>
        )}
      </article>

      <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,1fr)_300px]">
        <IssueActions issueId={issue.id} category={issue.category} upCount={issue.upCount} resolved={resolved} />

        <section aria-labelledby="timeline-title">
          <h2 id="timeline-title" className="font-display text-xl font-bold">
            Évolution
          </h2>
          <ol className="mt-4 grid gap-0">
            {issue.timeline.map((e, i) => (
              <li key={i} className="relative grid grid-cols-[16px_1fr] gap-3 pb-5 last:pb-0">
                <span className="relative flex justify-center" aria-hidden="true">
                  <span className={`mt-1.5 block h-2.5 w-2.5 rounded-full ${e.tone === "resolved" ? "bg-resolved" : "bg-signal"}`} />
                  {i < issue.timeline.length - 1 && <span className="absolute bottom-[-4px] top-5 w-0.5 bg-border" />}
                </span>
                <span>
                  <span className="block text-[13px] font-semibold text-ink-muted">{formatDay(e.date)}</span>
                  <span className="block text-[15px]">{e.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="mt-12 rounded-[20px] bg-signal-soft p-6 md:flex md:items-center md:justify-between md:gap-6">
        <div>
          <p className="font-semibold">Un autre problème dans ce lycée ?</p>
          <TrustLine className="mt-2" link={false} />
        </div>
        <ButtonLink href={`/signaler?lycee=${issue.school.slug}`} className="mt-3 md:mt-0">
          Signaler un problème
        </ButtonLink>
      </div>
    </div>
  );
}
