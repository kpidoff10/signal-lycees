// Crée ou met à jour un compte d'administration.
// Usage : npm run admin:create -- <identifiant> <ADMIN|MODERATOR> [--totp]
//   Mot de passe lu dans ADMIN_PASSWORD (12 caractères min.), sinon généré et affiché.
//   --totp : génère un secret TOTP et affiche l'URI otpauth:// à scanner.
import { scriptPrisma } from "./lib/prisma";
import { generatePassword, hashPassword } from "../src/server/admin/password";
import { generateTotpSecret, otpauthUri } from "../src/server/admin/totp";

function usage(msg?: string): never {
  if (msg) console.error(`Erreur : ${msg}`);
  console.error("Usage : npm run admin:create -- <identifiant> <ADMIN|MODERATOR> [--totp]");
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const withTotp = args.includes("--totp");
  const [rawUsername, rawRole] = args.filter((a) => !a.startsWith("--"));
  if (!rawUsername || !rawRole) usage();
  const username = rawUsername.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,64}$/.test(username)) usage("identifiant : 3 à 64 caractères (a-z, 0-9, . _ -).");
  const role = rawRole.toUpperCase();
  if (role !== "ADMIN" && role !== "MODERATOR") usage("rôle : ADMIN ou MODERATOR.");

  const fromEnv = process.env.ADMIN_PASSWORD;
  if (fromEnv !== undefined && fromEnv.length < 12) usage("ADMIN_PASSWORD doit faire au moins 12 caractères.");
  const password = fromEnv ?? generatePassword();
  const passwordHash = await hashPassword(password);
  const totpSecret = withTotp ? generateTotpSecret() : undefined;

  const prisma = scriptPrisma();
  try {
    const existing = await prisma.adminUser.findUnique({ where: { username }, select: { id: true } });
    const admin = await prisma.adminUser.upsert({
      where: { username },
      create: { username, role, passwordHash, totpSecret: totpSecret ?? null, active: true },
      // Sans --totp, le secret TOTP existant est conservé.
      update: { role, passwordHash, active: true, ...(totpSecret ? { totpSecret } : {}) },
    });
    await prisma.adminLog.create({
      data: {
        adminId: null,
        action: existing ? "ADMIN_UPDATE_CLI" : "ADMIN_CREATE_CLI",
        targetType: "AdminUser",
        targetId: admin.id,
        after: { username, role, totp: Boolean(admin.totpSecret) },
      },
    });
    console.log(`${existing ? "Compte mis à jour" : "Compte créé"} : ${username} (${role})`);
    if (fromEnv === undefined) console.log(`Mot de passe généré (à conserver, il ne sera plus affiché) : ${password}`);
    else console.log("Mot de passe : celui de ADMIN_PASSWORD.");
    if (totpSecret) {
      console.log(`Secret TOTP : ${totpSecret}`);
      console.log(`URI à scanner : ${otpauthUri(totpSecret, username)}`);
    } else if (admin.totpSecret) {
      console.log("TOTP : secret existant conservé.");
    }
    console.log("Connexion : /admin/connexion (les sessions ouvertes avec l'ancien mot de passe sont invalidées).");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
