import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { publicEnv } from "@/lib/env";
import { getAdminSession, requireAdmin } from "@/server/admin/auth";
import { dashboardCounts } from "@/server/admin/dashboard";
import { lastRuns } from "@/server/admin/imports";
import { trafficOverview } from "@/server/admin/traffic";
import { mobilizationsByDay } from "@/server/statistics";
import { ActionForm } from "./_components/ActionForm";
import { Automations } from "./_components/Automations";
import { MovementCard } from "./_components/MovementCard";
import { ShareLinksPanel } from "./_components/ShareLinksPanel";
import { TrafficPanel } from "./_components/TrafficPanel";
import { freezeAction, secondOpinionAction } from "./actions";

export const dynamic = "force-dynamic";

const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });

function greeting() {
  const h = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).format(new Date()));
  return h >= 18 || h < 5 ? "Bonsoir" : "Bonjour";
}

/** Interrupteur : un bouton de formulaire qui bascule le réglage. */
function Toggle({
  action,
  on,
  label,
  hint,
  fields,
  confirm,
  danger,
}: {
  action: Parameters<typeof ActionForm>[0]["action"];
  on: boolean;
  label: string;
  hint: string;
  fields: Record<string, string>;
  confirm?: string;
  danger?: boolean;
}) {
  return (
    <ActionForm action={action} confirmMessage={confirm} className="adm-toggle-row">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <span className="adm-toggle-text">
        <b>{label}</b>
        <span className="adm-small adm-muted">{hint}</span>
      </span>
      <button type="submit" role="switch" aria-checked={on} aria-label={label} className={`adm-switch${danger ? " is-danger" : ""}`}>
        <span className="adm-switch-knob" />
      </button>
    </ActionForm>
  );
}

export default async function AdminHome() {
  await requireAdmin();
  const [c, traffic, session, runs, days] = await Promise.all([dashboardCounts(), trafficOverview(), getAdminSession(), lastRuns(), mobilizationsByDay(new Date())]);

  const todo: { href: string; icon: IconName; value: number; label: string; urgent?: boolean }[] = [
    { href: "/admin/moderation", icon: "alert", value: c.urgent, label: c.urgent > 1 ? "signalements urgents" : "signalement urgent", urgent: true },
    { href: "/admin/moderation", icon: "inbox", value: c.queue, label: "dans la file de modération" },
    { href: "/admin/moderation", icon: "flag", value: c.openReports, label: "contenus signalés par des visiteurs" },
    { href: "/admin/moderation", icon: "thumbDown", value: c.flagged, label: "publiés avec beaucoup de 👎" },
    { href: "/admin/mobilisations", icon: "megaphone", value: c.pendingMobs, label: "mobilisations à valider" },
    { href: "/admin/presse", icon: "news", value: c.pendingPress, label: "articles de presse à vérifier" },
    { href: "/admin/requests", icon: "mail", value: c.pendingRequests, label: "demandes (contact, suppression)" },
  ];
  const pending = todo.filter((t) => t.value > 0);
  const total = pending.reduce((s, t) => s + t.value, 0);

  return (
    <div className="adm-stack adm-stack-lg">
      <header className="adm-hello">
        <p className="adm-hello-date">{dayFmt.format(new Date())}</p>
        <h1 className="adm-h1">
          {greeting()} <span className="adm-name">{session?.username ?? ""}</span> 👋
        </h1>
        <p className="adm-sub">{total === 0 ? "Rien ne t'attend : tout est à jour." : `${total} élément${total > 1 ? "s" : ""} t'attend${total > 1 ? "ent" : ""}.`}</p>
      </header>

      {c.frozen && (
        <p className="adm-msg adm-msg-error adm-msg-big">
          <Icon name="alert" /> Publication automatique suspendue : chaque nouveau signalement part en revue manuelle.
        </p>
      )}

      <section aria-labelledby="todo-h" className="adm-stack">
        <h2 id="todo-h" className="adm-h2">
          À traiter
        </h2>
        {pending.length === 0 ? (
          <div className="adm-calm">
            <span className="adm-calm-icon" aria-hidden="true">
              <Icon name="check" size={22} />
            </span>
            <span>
              <b>Tout est à jour.</b>
              <span className="adm-muted"> Jev et le second avis s&apos;occupent du reste ; Telegram te prévient s&apos;il faut agir.</span>
            </span>
          </div>
        ) : (
          <div className="adm-todo">
            {pending.map((t) => (
              <Link key={t.label} href={t.href} className={`adm-todo-card${t.urgent ? " is-urgent" : ""}`}>
                <span className="adm-todo-icon" aria-hidden="true">
                  <Icon name={t.icon} size={20} />
                </span>
                <span className="adm-todo-value">{t.value.toLocaleString("fr-FR")}</span>
                <span className="adm-todo-label">{t.label}</span>
                <Icon name="chevron" size={18} className="adm-todo-go" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="adm-duo">
        <MovementCard days={days} activeNow={c.activeMobs} pending={c.pendingMobs} />
        <section className="adm-card adm-stack" aria-labelledby="autos-h">
          <h2 id="autos-h" className="adm-h2">
            Automatisations
          </h2>
          <Automations research={runs.research} press={runs.press} />
        </section>
      </div>

      <TrafficPanel t={traffic} />

      <section className="adm-card" aria-labelledby="settings-h">
        <h2 id="settings-h" className="adm-h2">
          Réglages de la modération
        </h2>
        <div className="adm-toggles">
          {c.frozenByEnv ? (
            <p className="adm-msg adm-msg-error">
              Publication automatique suspendue par la variable d&apos;environnement MODERATION_FREEZE : à modifier dans la configuration du serveur.
            </p>
          ) : (
            <Toggle
              action={freezeAction}
              on={!c.frozen}
              label="Publication automatique"
              hint={c.frozen ? "Suspendue : tout part en revue manuelle." : "Les signalements sans risque sont publiés directement."}
              fields={{ frozen: c.frozen ? "0" : "1" }}
              confirm={c.frozen ? "Réactiver la publication automatique ?" : "Suspendre la publication automatique ? Tout passera en revue manuelle."}
              danger
            />
          )}
          <Toggle
            action={secondOpinionAction}
            on={c.secondOpinion.issues}
            label="Second avis GPT : signalements"
            hint={
              c.secondOpinion.issues
                ? "Quand Jev hésite, GPT publie, reformule légèrement ou te laisse la décision."
                : "Désactivé : les doutes de Jev arrivent dans ta file."
            }
            fields={{ scope: "issues", enabled: c.secondOpinion.issues ? "0" : "1" }}
          />
          <Toggle
            action={secondOpinionAction}
            on={c.secondOpinion.press}
            label="Second avis GPT : revue de presse"
            hint={c.secondOpinion.press ? "Quand Jev hésite, GPT publie ou écarte l'article." : "Désactivé : les doutes de Jev arrivent dans Presse."}
            fields={{ scope: "press", enabled: c.secondOpinion.press ? "0" : "1" }}
          />
          <Toggle
            action={secondOpinionAction}
            on={c.secondOpinion.mobilizations}
            label="Second avis GPT : mobilisations de presse"
            hint={
              c.secondOpinion.mobilizations
                ? "Quand Jev hésite sur un blocage, GPT publie, te laisse valider ou écarte en te prévenant sur Telegram."
                : "Désactivé : les blocages où Jev hésite arrivent dans Mobilisations."
            }
            fields={{ scope: "mobilizations", enabled: c.secondOpinion.mobilizations ? "0" : "1" }}
          />
          <Toggle
            action={secondOpinionAction}
            on={c.secondOpinion.verification}
            label="Vérification IA des recherches et listes"
            hint={
              c.secondOpinion.verification
                ? "Perplexity relit l’article de chaque lycée trouvé : publié s’il confirme, écarté s’il infirme, à valider s’il doute."
                : "Désactivé : tous les lycées trouvés par les recherches et les listes arrivent à valider."
            }
            fields={{ scope: "verification", enabled: c.secondOpinion.verification ? "0" : "1" }}
          />
        </div>
        <p className="m-0 mt-3 adm-small adm-muted">
          Limitation anti-abus : {c.limiter === "upstash" ? "partagée (Upstash) ✓" : "en mémoire (développement)"}
          {c.limiter === "memory" && process.env.NODE_ENV === "production" && " : non partagée, les limites sont faciles à contourner."}
        </p>
      </section>

      <details className="adm-card adm-fold">
        <summary>
          <span className="adm-fold-title">
            <span className="adm-h2">Liens de partage</span>
            <span className="adm-small adm-muted">Un lien suivi par canal (Instagram, X, affiches…), à copier.</span>
          </span>
        </summary>
        <ShareLinksPanel links={traffic.links} posterVisits={traffic.posterVisits} siteUrl={publicEnv.siteUrl} />
      </details>
    </div>
  );
}
