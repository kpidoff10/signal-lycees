import "server-only";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { env, publicEnv } from "@/lib/env";
import { category, type CategoryId } from "@/lib/categories";

// Notifications Telegram pour la modération.
// Confidentialité : JAMAIS le texte d'un élève (titre, description, message) — seulement
// le lycée, la catégorie, l'urgence et un lien vers l'admin, où le contenu se lit en sécurité.

export type NotifyEvent =
  | { type: "issue"; issueId: string; status: "PUBLISHED" | "MANUAL_REVIEW" | "REJECTED"; priority: "NORMAL" | "ELEVATED" | "URGENT"; showHelp?: boolean }
  | { type: "contentReport"; issueId: string; hidden: boolean }
  | { type: "downvotes"; issueId: string }
  | { type: "privacy"; kind: "DELETION" | "CONTACT"; linked: boolean }
  | { type: "mobilization"; mobilizationId: string; flagged: boolean; press?: boolean }
  | { type: "press"; pending: number }
  | { type: "pressList"; source: string; created: number; unmatched: string[] };

interface IssueInfo {
  school: string;
  city: string;
  category: CategoryId | null;
}

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

/** Construit le message (HTML Telegram). Fonction pure, testée. */
export function formatNotification(e: NotifyEvent, info: IssueInfo | null, siteUrl: string): string | null {
  const admin = `${siteUrl.replace(/\/$/, "")}/admin`;
  const where = info
    ? `${esc(info.school)} (${esc(info.city)})${info.category ? `\n${category(info.category).emoji} ${category(info.category).label}` : ""}`
    : "";
  switch (e.type) {
    case "issue":
      if (e.status === "PUBLISHED") return `✅ <b>Nouveau signalement publié</b>\n${where}\n${admin}/issues/${e.issueId}`;
      if (e.status === "REJECTED") return null; // refus automatique : rien à faire
      if (e.priority === "URGENT")
        return `🚨 <b>Signalement URGENT à vérifier</b>${e.showHelp ? " (détresse possible)" : ""}\n${where}\nÀ traiter rapidement : ${admin}/moderation`;
      return `🕵️ <b>Signalement à vérifier</b>${e.priority === "ELEVATED" ? " (prioritaire)" : ""}\n${where}\n${admin}/moderation`;
    case "contentReport":
      return `🚩 <b>Contenu signalé</b>${e.hidden ? " — dépublié en attendant ta décision" : ""}\n${where}\n${admin}/moderation`;
    case "downvotes":
      return `👎 <b>Beaucoup de « pas sérieux »</b> sur un problème publié\n${where}\n${admin}/moderation`;
    case "mobilization":
      return `📣 <b>Mobilisation ${e.press ? "repérée dans la presse" : "signalée par un élève"}, à valider</b>${e.flagged ? " (motifs à relire attentivement)" : ""}\n${where}\n${admin}/mobilisations`;
    case "press":
      return `📰 <b>${e.pending} article${e.pending > 1 ? "s" : ""} de presse à vérifier</b> (doute de Jev)\n${admin}/presse`;
    case "pressList": {
      // Noms de lycées tirés d'un article publié : information publique.
      const missing = e.unmatched.length ? `\nIntrouvables dans l'annuaire (à ajouter à la main si besoin) : ${esc(e.unmatched.slice(0, 15).join(", "))}${e.unmatched.length > 15 ? "…" : ""}` : "";
      return `📣 <b>Liste de ${e.created} lycée${e.created > 1 ? "s" : ""} fermé${e.created > 1 ? "s" : ""} ou bloqué${e.created > 1 ? "s" : ""}</b> (${esc(e.source)}), à valider${missing}\n${admin}/mobilisations`;
    }
    case "privacy":
      return `📨 <b>${e.kind === "DELETION" ? "Demande de suppression" : "Nouveau message de contact"}</b>${e.linked ? " (liée à un signalement)" : ""}\n${admin}/requests`;
  }
}

async function send(text: string) {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chatId } = env();
  if (!token || !chatId) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error("telegram", res.status);
  } catch (err) {
    console.error("telegram", err instanceof Error ? err.message : err);
  }
}

function enabled(e: NotifyEvent): boolean {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_NOTIFY_PUBLISHED } = env();
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;
  return !(e.type === "issue" && e.status === "PUBLISHED" && !TELEGRAM_NOTIFY_PUBLISHED);
}

/** Envoie tout de suite (pour du code qui tourne déjà après la réponse, dans un `after`). */
export async function notifyNow(e: NotifyEvent) {
  if (!enabled(e)) return;
  let info: IssueInfo | null = null;
  if ("issueId" in e) {
    const i = await prisma.issue.findUnique({
      where: { id: e.issueId },
      select: { category: true, school: { select: { name: true, city: true } } },
    });
    if (i) info = { school: i.school.name, city: i.school.city, category: i.category };
  } else if (e.type === "mobilization") {
    const m = await prisma.mobilization.findUnique({ where: { id: e.mobilizationId }, select: { school: { select: { name: true, city: true } } } });
    if (m) info = { school: m.school.name, city: m.school.city, category: null };
  }
  const text = formatNotification(e, info, publicEnv.siteUrl);
  if (text) await send(text);
}

/** Envoie la notification après la réponse à l'élève (ne ralentit jamais son action). */
export function notify(e: NotifyEvent) {
  if (!enabled(e)) return;
  after(() => notifyNow(e));
}

/** Message de test (script). */
export async function sendTestNotification() {
  await send("🔔 <b>Signal Lycées</b> : les notifications de modération sont actives.");
}
