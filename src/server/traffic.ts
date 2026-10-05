import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { publicEnv } from "@/lib/env";
import { countablePath, isBot, isOutreachCode, parisDay, sourceFromCampaign, sourceFromReferrer } from "@/lib/traffic";
import { hmac } from "./crypto";
import { clientIp } from "./request";

/** Enregistre une page vue : compteurs agrégés seulement, aucune donnée personnelle conservée. */
export async function recordPageView(input: { path: unknown; referrer: unknown; campaign?: unknown }) {
  const h = await headers();
  const ua = h.get("user-agent");
  if (isBot(ua)) return;
  const path = countablePath(input.path);
  if (!path) return;
  const dayKey = parisDay();
  const day = new Date(`${dayKey}T00:00:00Z`);
  const ownHost = new URL(publicEnv.siteUrl).hostname;
  const contact = await outreachContact(input.campaign);
  const source = sourceFromCampaign(input.campaign) ?? (contact ? `Mail · ${contact.campaign}` : null) ?? sourceFromReferrer(input.referrer, ownHost);
  // Lien personnel d'un contact démarché : on note son arrivée (page et heure), à chaque visite.
  if (contact) await prisma.outreachVisit.create({ data: { contactId: contact.id, path } }).catch(() => null);
  // Empreinte du jour : HMAC(IP + navigateur) avec un sel qui change chaque jour, effacée le lendemain.
  const hash = hmac(`${await clientIp()}|${ua}`, `visitor:${dayKey}`);

  const isNew = await prisma.trafficVisitor
    .create({ data: { day, hash } })
    .then(() => true)
    .catch(() => false);
  // Provenance comptée une fois par visiteur et par jour (son arrivée sur le site).
  await prisma.$transaction([
    prisma.trafficDay.upsert({
      where: { day },
      create: { day, views: 1, visitors: isNew ? 1 : 0 },
      update: { views: { increment: 1 }, ...(isNew ? { visitors: { increment: 1 } } : {}) },
    }),
    prisma.trafficPage.upsert({
      where: { day_path: { day, path } },
      create: { day, path, views: 1 },
      update: { views: { increment: 1 } },
    }),
    ...(isNew
      ? [
          prisma.trafficSource.upsert({
            where: { day_source: { day, source } },
            create: { day, source, views: 1 },
            update: { views: { increment: 1 } },
          }),
        ]
      : []),
  ]);
}

/** Contact démarché dont le code ?src= est donné, ou null (codes des liens de partage exclus). */
async function outreachContact(code: unknown): Promise<{ id: string; campaign: string } | null> {
  if (typeof code !== "string" || !isOutreachCode(code)) return null;
  return prisma.outreachContact.findUnique({ where: { code }, select: { id: true, campaign: true } }).catch(() => null);
}

/** Purge des empreintes des jours passés (appelée par la tâche planifiée). */
export async function purgeVisitorHashes() {
  const today = new Date(`${parisDay()}T00:00:00Z`);
  return (await prisma.trafficVisitor.deleteMany({ where: { day: { lt: today } } })).count;
}
