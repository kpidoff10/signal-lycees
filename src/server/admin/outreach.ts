// Contacts démarchés par mail et leurs visites (liens ?src= personnels).
import "server-only";
import { prisma } from "@/lib/db";

export async function listOutreach() {
  const contacts = await prisma.outreachContact.findMany({
    orderBy: [{ createdAt: "desc" }, { label: "asc" }],
    include: { visits: { orderBy: { at: "asc" }, select: { path: true, at: true } } },
  });
  const campaigns = new Map<string, typeof contacts>();
  for (const c of contacts) campaigns.set(c.campaign, [...(campaigns.get(c.campaign) ?? []), c]);
  return [...campaigns].map(([campaign, rows]) => ({
    campaign,
    sent: rows.filter((r) => r.sentAt).length,
    visited: rows.filter((r) => r.visits.length).length,
    // Ceux qui sont venus d'abord, les plus récents en tête.
    contacts: rows.sort((a, b) => (b.visits.at(-1)?.at.getTime() ?? 0) - (a.visits.at(-1)?.at.getTime() ?? 0)),
  }));
}
