import { ImageResponse } from "next/og";
import { OG_SIZE, OgChip, OgFrame, ogFonts } from "@/lib/og";
import { formatNumber } from "@/lib/format";
import { nationalStats } from "@/server/stats";
import { prisma } from "@/lib/db";

export const alt = "Signal Lycées : signale anonymement ce qui ne va pas dans ton lycée";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image() {
  const [stats, mobs] = await Promise.all([
    nationalStats().catch(() => null),
    prisma.mobilization.count({ where: { status: "PUBLISHED", expiresAt: { gt: new Date() } } }).catch(() => 0),
  ]);
  const chips = [<OgChip key="a" strong>Anonyme · gratuit</OgChip>];
  if (stats?.activeIssues) chips.push(<OgChip key="b">{formatNumber(stats.activeIssues)} problèmes signalés</OgChip>);
  if (mobs) chips.push(<OgChip key="c">{formatNumber(mobs)} lycées mobilisés</OgChip>);
  return new ImageResponse(
    <OgFrame eyebrow="Par et pour les lycéens" title="Ce qui se passe dans ton lycée mérite d’être entendu." chips={chips} footer="signal-lycees.fr" />,
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
