// Données FICTIVES pour le développement local uniquement.
// Refuse de tourner en production ou sur une base Neon : jamais de faux signalements en ligne.
import { createHash, randomBytes } from "node:crypto";
import { scriptPrisma } from "../scripts/lib/prisma";
import type { IssueCategory } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL ?? "";
if (process.env.NODE_ENV === "production" || /neon\.tech|vercel/i.test(url)) {
  console.error("Seed refusé : base de production détectée.");
  process.exit(1);
}

const SAMPLES: Record<IssueCategory, [string, string][]> = {
  BUILDING: [
    ["Plusieurs salles sans chauffage", "Depuis lundi, plusieurs salles du bâtiment B n'ont plus de chauffage. On garde nos manteaux en cours."],
    ["Fuite au plafond en salle de sciences", "Quand il pleut, l'eau coule du plafond de la salle 204. Des seaux sont posés au sol."],
    ["Pas de savon dans les sanitaires", "Les distributeurs du rez-de-chaussée sont vides depuis plusieurs semaines."],
    ["Fenêtres qui ne ferment plus", "Plusieurs fenêtres du 2e étage ne ferment plus, il y a des courants d'air permanents."],
    ["Toilettes du bâtiment A fermées", "Les toilettes du bâtiment A sont fermées depuis la rentrée, il n'en reste qu'un bloc pour tout le lycée."],
    ["Préau inondé quand il pleut", "Le préau se remplit d'eau à chaque averse, impossible de s'y abriter."],
  ],
  CATERING: [
    ["Attente de 40 min à la cantine", "Le self est saturé entre 12 h et 13 h, certains élèves n'ont pas le temps de manger avant la reprise."],
    ["Pas de plat végétarien certains jours", "Le menu ne propose pas d'alternative végétarienne deux jours par semaine."],
    ["Plats servis froids", "Les plats chauds arrivent tièdes voire froids pour le deuxième service."],
  ],
  CLASSES: [
    ["Cours de maths non assurés depuis 3 semaines", "Les cours de maths d'une classe de 1re ne sont plus assurés depuis trois semaines, sans remplacement."],
    ["Classes surchargées en terminale", "Plusieurs classes de terminale dépassent 36 élèves, il manque des chaises."],
  ],
  ORGANIZATION: [
    ["Emploi du temps changé sans prévenir", "Les changements d'emploi du temps sont affichés le matin même, sans information sur l'ENT."],
    ["Pas d'information sur les épreuves blanches", "Les dates du bac blanc n'ont toujours pas été communiquées."],
  ],
  SECURITY: [
    ["Portail arrière ouvert en permanence", "Le portail arrière reste ouvert toute la journée, n'importe qui peut entrer."],
    ["Éclairage cassé sur le parking", "Le parking à vélos n'est plus éclairé le soir depuis un mois."],
  ],
  ACCESSIBILITY: [
    ["Ascenseur en panne depuis 2 semaines", "L'ascenseur principal est en panne, les élèves en fauteuil ne peuvent pas accéder au 1er étage."],
    ["Pas de rampe pour le gymnase", "L'accès au gymnase se fait uniquement par des marches."],
  ],
  OTHER: [["Casiers trop peu nombreux", "Il n'y a pas assez de casiers, beaucoup d'élèves portent tous leurs livres toute la journée."]],
};

const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T>(a: T[]) => a[rand(a.length)]!;

async function main() {
  const prisma = scriptPrisma();
  await prisma.issue.deleteMany({});
  await prisma.anonymousIdentity.deleteMany({});
  const author = await prisma.anonymousIdentity.create({ data: {} });
  const schools = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "School" WHERE "isOpen" ORDER BY random() LIMIT 420`;
  const dijon = await prisma.school.findMany({ where: { city: "Dijon" }, select: { id: true } });
  const targets = [...dijon.map((s) => s.id), ...schools.map((s) => s.id)];
  const cats = Object.keys(SAMPLES) as IssueCategory[];
  let n = 0;
  for (const schoolId of targets) {
    const count = 1 + (Math.random() < 0.2 ? rand(10) : rand(3));
    for (let k = 0; k < count; k++) {
      const category = pick(cats);
      const [title, description] = pick(SAMPLES[category]);
      const ageDays = rand(120);
      const createdAt = new Date(Date.now() - ageDays * 86_400_000 - rand(86_400_000));
      const upCount = 1 + (Math.random() < 0.1 ? rand(180) : rand(15));
      const resolved = Math.random() < 0.15;
      await prisma.issue.create({
        data: {
          schoolId,
          authorId: author.id,
          category,
          title,
          description,
          status: resolved ? "RESOLVED" : "ACTIVE",
          moderationStatus: "PUBLISHED",
          upCount,
          downCount: rand(3),
          trackingTokenHash: createHash("sha256").update(randomBytes(16)).digest("hex"),
          createdAt,
          publishedAt: createdAt,
          lastActivityAt: new Date(createdAt.getTime() + rand(ageDays + 1) * 86_400_000),
          resolvedAt: resolved ? new Date() : null,
          events: { create: [{ type: "CREATED", createdAt }, { type: "PUBLISHED", createdAt }] },
          dailyStats: {
            create: [
              { day: new Date(createdAt.toISOString().slice(0, 10)), upTotal: 1, resolvedTotal: 0 },
              ...(ageDays > 2 ? [{ day: new Date(new Date(createdAt.getTime() + 86_400_000).toISOString().slice(0, 10)), upTotal: Math.ceil(upCount / 3), resolvedTotal: 0 }] : []),
              ...(ageDays > 4 ? [{ day: new Date(new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)), upTotal: upCount, resolvedTotal: resolved ? 4 : 0 }] : []),
            ],
          },
        },
      });
      n++;
    }
  }
  console.log(`${n} signalements fictifs créés dans ${targets.length} lycées.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
