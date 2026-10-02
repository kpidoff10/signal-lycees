import { ImageResponse } from "next/og";
import { OG_SIZE, OgChip, OgFrame, ogFonts } from "@/lib/og";
import { prisma } from "@/lib/db";
import { formatNumber, plural } from "@/lib/format";
import { shortSchoolName } from "@/lib/school-name";
import { activeMobilizations } from "@/server/mobilizations";

export const alt = "Problèmes signalés dans ce lycée sur Signal Lycées";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = await prisma.school.findUnique({ where: { slug }, select: { id: true, name: true, city: true } });
  const fonts = await ogFonts();
  if (!school) {
    return new ImageResponse(<OgFrame eyebrow="Signal Lycées" title="Signale ce qui ne va pas dans ton lycée." chips={[]} footer="signal-lycees.fr" />, { ...OG_SIZE, fonts });
  }
  const [active, conf, mobs] = await Promise.all([
    prisma.issue.count({ where: { schoolId: school.id, moderationStatus: { in: ["PUBLISHED", "AUTO_APPROVED"] }, status: { not: "RESOLVED" } } }),
    prisma.issue.aggregate({ where: { schoolId: school.id, moderationStatus: { in: ["PUBLISHED", "AUTO_APPROVED"] } }, _sum: { upCount: true } }),
    activeMobilizations([school.id]),
  ]);
  const confirmations = conf._sum.upCount ?? 0;
  const chips = [];
  if (mobs.has(school.id)) chips.push(<OgChip key="m" strong>Mobilisation en cours</OgChip>);
  chips.push(
    <OgChip key="a">{active ? `${formatNumber(active)} ${plural(active, "problème signalé", "problèmes signalés")}` : "Aucun problème signalé pour l’instant"}</OgChip>,
  );
  if (confirmations) chips.push(<OgChip key="c">{`${formatNumber(confirmations)} ${plural(confirmations, "confirmation")}`}</OgChip>);
  return new ImageResponse(
    <OgFrame eyebrow={school.city} title={shortSchoolName(school.name)} chips={chips} footer="Signale ce qui ne va pas, anonymement · signal-lycees.fr" />,
    { ...OG_SIZE, fonts },
  );
}
