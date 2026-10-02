// Envoie un message de test Telegram. Usage : TELEGRAM_BOT_TOKEN=… TELEGRAM_CHAT_ID=… npx tsx scripts/telegram-test.ts
// Sans TELEGRAM_CHAT_ID : affiche les conversations récentes du bot pour trouver l'identifiant.
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN manquant");
async function main() {
  if (!chatId) {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = (await res.json()) as { result?: { message?: { chat: { id: number; first_name?: string; username?: string } } }[] };
    const chats = new Map<number, string>();
    for (const u of data.result ?? []) if (u.message) chats.set(u.message.chat.id, u.message.chat.username ?? u.message.chat.first_name ?? "?");
    console.log(chats.size ? [...chats].map(([id, n]) => `${id}  (${n})`).join("\n") : "Aucun message reçu : envoie d'abord « /start » au bot.");
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: "🔔 <b>Signal Lycées</b> : les notifications de modération sont actives.", parse_mode: "HTML" }),
  });
  console.log(res.ok ? "Message envoyé." : `Échec : HTTP ${res.status} ${await res.text()}`);
}
main();
