import type { Metadata } from "next";
import { ReportWizard } from "@/components/report/ReportWizard";
import { getSchoolBySlug } from "@/server/school-page";

export const metadata: Metadata = {
  title: "Signaler un problème",
  description: "Signale un problème dans ton lycée en moins d’une minute. Anonyme, sans compte ni e-mail.",
  robots: { index: false },
};

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ lycee?: string | string[] }> }) {
  const { lycee } = await searchParams;
  const slug = typeof lycee === "string" ? lycee.slice(0, 120) : undefined;
  const school = slug ? await getSchoolBySlug(slug) : null;
  return (
    <div className="container-page pb-20 pt-8 md:pt-12">
      <ReportWizard
        initialSchool={school ? { id: school.id, slug: school.slug, name: school.name, city: school.city, postalCode: school.postalCode } : null}
      />
    </div>
  );
}
