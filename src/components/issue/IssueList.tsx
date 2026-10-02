"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { myVotesAction } from "@/app/actions/issues";
import { CategoryBadge, ResolvedBadge } from "@/components/ui/CategoryBadge";
import { CategoryChips } from "@/components/ui/Chips";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { type CategoryId } from "@/lib/categories";
import { formatNumber, plural, timeAgo } from "@/lib/format";
import { wilsonLowerBound } from "@/lib/wilson";
import { ConfirmButton } from "./ConfirmButton";

export interface IssueItem {
  id: string;
  category: CategoryId;
  title: string;
  status: "ACTIVE" | "POSSIBLY_RESOLVED" | "RESOLVED";
  upCount: number;
  downCount: number;
  createdAt: string;
  lastActivityAt: string;
  resolvedAt: string | null;
}

type Sort = "confirmed" | "recent" | "active";

const SORTS: { value: Sort; label: string }[] = [
  { value: "confirmed", label: "Les plus confirmés" },
  { value: "recent", label: "Les plus récents" },
  { value: "active", label: "Toujours actifs (activité récente)" },
];

function IssueRow({ issue, myVote }: { issue: IssueItem; myVote: "UP" | "DOWN" | null }) {
  const [count, setCount] = useState(issue.upCount);
  const resolved = issue.status === "RESOLVED";
  return (
    <li className="rounded-[var(--radius-md)] border border-border bg-surface p-4 md:px-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
            {resolved && <ResolvedBadge />}
            {issue.status === "POSSIBLY_RESOLVED" && <ResolvedBadge label="Peut-être résolu" />}
            <CategoryBadge id={issue.category} />
            <span>Signalé {timeAgo(new Date(issue.createdAt))}</span>
          </div>
          <Link href={`/probleme/${issue.id}`} className="mt-2 block text-[17px] font-semibold leading-6 hover:underline">
            {issue.title}
          </Link>
        </div>
        <div className="flex items-center justify-between gap-4 md:justify-end">
          <p className="text-[13px] text-ink-muted md:text-right">
            <span className="num block font-display text-[22px] font-bold leading-7 text-ink max-md:inline max-md:text-[17px]">{formatNumber(count)}</span>{" "}
            {plural(count, "confirmation")}
          </p>
          {!resolved && <ConfirmButton issueId={issue.id} category={issue.category} initialVote={myVote} onCount={setCount} />}
        </div>
      </div>
    </li>
  );
}

/** Liste des problèmes d'un lycée : onglets Actifs / Résolus, filtres de catégorie, tri. */
export function IssueList({ issues }: { issues: IssueItem[] }) {
  const [votes, setVotes] = useState<Record<string, "UP" | "DOWN"> | null>(null);
  useEffect(() => {
    myVotesAction(issues.map((i) => i.id)).then(setVotes, () => setVotes({}));
  }, [issues]);
  const [tab, setTab] = useState<"active" | "resolved">("active");
  const [cats, setCats] = useState<CategoryId[]>([]);
  const [sort, setSort] = useState<Sort>("confirmed");
  const [limit, setLimit] = useState(8);

  const active = issues.filter((i) => i.status !== "RESOLVED");
  const resolved = issues.filter((i) => i.status === "RESOLVED");
  const base = tab === "active" ? active : resolved;

  const counts = useMemo(() => {
    const c: Partial<Record<CategoryId, number>> = {};
    for (const i of base) c[i.category] = (c[i.category] ?? 0) + 1;
    return c;
  }, [base]);

  const list = useMemo(() => {
    const filtered = cats.length ? base.filter((i) => cats.includes(i.category)) : base;
    const sorted = [...filtered];
    if (sort === "confirmed") sorted.sort((a, b) => wilsonLowerBound(b.upCount, b.downCount) - wilsonLowerBound(a.upCount, a.downCount) || b.upCount - a.upCount);
    if (sort === "recent") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "active") sorted.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
    return sorted;
  }, [base, cats, sort]);

  return (
    <div className="grid content-start gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-[28px] font-bold leading-8 md:text-[32px] md:leading-9">Problèmes signalés</h2>
        <Segmented
          label="Afficher"
          value={tab}
          onChange={(t) => {
            setTab(t);
            setCats([]);
            setLimit(8);
          }}
          className="max-md:w-full max-md:[&>button]:flex-1"
          options={[
            { value: "active", label: `Actifs · ${active.length}` },
            { value: "resolved", label: `Résolus · ${resolved.length}` },
          ]}
        />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <CategoryChips value={cats} onChange={setCats} counts={counts} only={Object.keys(counts) as CategoryId[]} scroll />
        <label className="flex items-center gap-2 text-sm font-semibold">
          Trier
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field !w-auto !py-2 !text-[14px] font-semibold">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {list.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-border-strong p-6 text-center text-ink-muted">
          {tab === "active" ? "Aucun problème actif signalé ici pour l’instant." : "Aucun problème résolu pour l’instant."}
        </p>
      ) : (
        <ul className="grid content-start gap-3">
          {list.slice(0, limit).map((i) => (
            <IssueRow key={`${i.id}-${votes ? "v" : "n"}`} issue={i} myVote={votes?.[i.id] ?? null} />
          ))}
        </ul>
      )}
      {list.length > limit && (
        <Button variant="secondary" block onClick={() => setLimit((l) => l + 20)}>
          Afficher {list.length - limit === 1 ? "l’autre problème" : `les ${list.length - limit} autres problèmes`}
        </Button>
      )}
    </div>
  );
}
