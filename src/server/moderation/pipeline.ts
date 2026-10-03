import "server-only";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import type { CategoryId } from "@/lib/categories";
import { callJev, callJevGateway, JevError, type JevResult } from "./jev";
import { decide, type DecisionResult } from "./decide";
import { runRules } from "./rules";
import { isModerationFrozen } from "../settings";

export interface ModerationOutcome extends DecisionResult {
  jev: JevResult | null;
  jevError?: string;
  provider: "jev" | "none";
  latencyMs: number;
  rules: ReturnType<typeof runRules>;
}

/** Plafond quotidien d'appels Jev (protège le budget) : au-delà, revue manuelle. */
async function jevBudgetLeft(): Promise<boolean> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const used = await prisma.aIAnalysis.count({ where: { provider: "jev", createdAt: { gte: since } } });
  return used < env().JEV_DAILY_LIMIT;
}

export async function moderate(input: { title: string; description: string; category: CategoryId }): Promise<ModerationOutcome> {
  const started = Date.now();
  const rules = runRules(input.title, input.description);
  const frozen = await isModerationFrozen();
  const e = env();

  let jev: JevResult | null = null;
  let jevError: string | undefined;
  let provider: "jev" | "none" = "none";

  // Sur Vercel, le jeton OIDC arrive avec chaque requête (pas dans l'environnement) : la passerelle est toujours joignable.
  const viaGateway = !!(e.AI_GATEWAY_API_KEY || e.VERCEL_OIDC_TOKEN || process.env.VERCEL);
  if (!viaGateway && !e.TYPESAFE_API_KEY) {
    jevError = "non configurée";
  } else if (!(await jevBudgetLeft())) {
    jevError = "plafond quotidien atteint";
  } else {
    provider = "jev";
    try {
      // Passerelle Vercel en priorité (une seule facture, OIDC en production), sinon API TypeSafe directe.
      jev = viaGateway
        ? await callJevGateway({ model: e.JEV_GATEWAY_MODEL, timeoutMs: e.JEV_TIMEOUT_MS }, input)
        : await callJev({ apiKey: e.TYPESAFE_API_KEY, url: e.TYPESAFE_API_URL, model: e.JEV_MODEL, timeoutMs: e.JEV_TIMEOUT_MS }, input);
    } catch (err) {
      jevError = err instanceof JevError ? `${err.kind} : ${err.message}` : "erreur inconnue";
    }
  }

  const result = decide({ rules, jev, jevError, frozen });
  return { ...result, jev, jevError, provider, latencyMs: Date.now() - started, rules };
}
