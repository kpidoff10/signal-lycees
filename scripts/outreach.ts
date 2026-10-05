// Contacts démarchés par mail : chaque contact reçoit un code ?src= personnel (voir OutreachContact).
// Ajout : npm run outreach -- add <fichier.json>   (JSON : { "campaign": "...", "contacts": [{ "label": "...", "email": "..." }] })
//         affiche le code de chaque contact (déjà existant : même code, rien n'est recréé).
// Envoi : npm run outreach -- sent <code> [<code>…]   marque les mails comme envoyés.
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { newOutreachCode } from "../src/lib/traffic";
import { scriptPrisma } from "./lib/prisma";

const fileSchema = z.object({
  campaign: z.string().regex(/^[a-z0-9-]{3,40}$/),
  contacts: z.array(z.object({ label: z.string().min(2).max(80), email: z.string().email() })),
});

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  const prisma = scriptPrisma();
  try {
    if (cmd === "add") {
      const data = fileSchema.parse(JSON.parse(await readFile(args[0]!, "utf8")));
      const out: { label: string; email: string; code: string }[] = [];
      for (const c of data.contacts) {
        const existing = await prisma.outreachContact.findFirst({ where: { campaign: data.campaign, email: c.email } });
        const row = existing ?? (await prisma.outreachContact.create({ data: { campaign: data.campaign, label: c.label, email: c.email, code: newOutreachCode() } }));
        out.push({ label: row.label, email: row.email, code: row.code });
      }
      console.log(JSON.stringify(out, null, 2));
    } else if (cmd === "sent") {
      const r = await prisma.outreachContact.updateMany({ where: { code: { in: args } }, data: { sentAt: new Date() } });
      console.log(`${r.count} contact(s) marqué(s) comme envoyé(s).`);
    } else {
      throw new Error("Usage : npm run outreach -- add <fichier.json> | sent <code>…");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
