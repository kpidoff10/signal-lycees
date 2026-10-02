import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Poster } from "@/components/poster/Poster";
import { PosterStudio } from "@/components/poster/PosterStudio";
import { publicEnv } from "@/lib/env";
import { POSTER_CODE } from "@/lib/share-links";
import { shortSchoolName } from "@/lib/school-name";
import { qrSvg } from "@/server/qr";
import { getSchoolBySlug } from "@/server/school-page";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const school = await getSchoolBySlug((await params).slug);
  if (!school) return {};
  return {
    title: `Affiche : ${shortSchoolName(school.name)}`,
    description: `Affiche et flyers à imprimer pour faire connaître Signal Lycées au ${shortSchoolName(school.name)} (${school.city}).`,
    // 5 600 variantes d'une même page : seule /affiches est indexée.
    robots: { index: false, follow: true },
  };
}

export default async function AfficheSchoolPage({ params }: Props) {
  const school = await getSchoolBySlug((await params).slug);
  if (!school || !school.isOpen) notFound();

  const base = publicEnv.siteUrl.replace(/\/$/, "");
  const qr = await qrSvg(`${base}/lycee/${school.slug}?src=${POSTER_CODE}`);

  return (
    <div className="container-page grid gap-6 py-6 md:py-10">
      <div className="grid gap-2">
        <Link href="/affiches" className="link w-fit text-[14px]">
          ← Changer de lycée
        </Link>
        <h1 className="display-m">Affiche pour {shortSchoolName(school.name)}</h1>
        <p className="text-ink-muted">
          À afficher sur les panneaux réservés aux lycéens, en informant la direction. Le QR code ouvre{" "}
          <Link href={`/lycee/${school.slug}`} className="link">
            la fiche du lycée
          </Link>
          .
        </p>
      </div>

      <PosterStudio
        a4={
          <div className="poster-sheet is-a4">
            <Poster school={school} qr={qr} />
          </div>
        }
        flyers={
          <div className="poster-sheet is-flyers">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="poster-cell">
                <Poster school={school} qr={qr} compact />
              </div>
            ))}
          </div>
        }
      />
    </div>
  );
}
