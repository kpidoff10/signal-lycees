import { describe, expect, it, vi } from "vitest";
import { buildJevRequest, callJev, callJevGateway, JevError, parseJevResponse, RISK_KEYS } from "../jev";

const input = { title: "Plusieurs salles sans chauffage", description: "Depuis lundi, le bâtiment B est froid.", category: "BUILDING" as const };
const config = { apiKey: "sk-test", url: "https://api.typesafe.ai/v1/systemone", model: "jev-latest", timeoutMs: 1000 };

function validResponse() {
  return {
    model: "jev-1.13.0",
    answers: {
      ...Object.fromEntries(RISK_KEYS.map((k) => [k, { type: "noul", noul: 0.02 }])),
      category: { type: "choice", choice: "BUILDING", confidence: 0.93, probabilities: {} },
      severity: { type: "score", score: 1.2, probabilities: [] },
    },
    usage: { input_tokens: 300, output_tokens: 20 },
  };
}

describe("buildJevRequest", () => {
  it("pose une question noul par risque, une choice et un score", () => {
    const req = buildJevRequest("jev-latest", input);
    for (const k of RISK_KEYS) expect(req.questions[k]).toMatchObject({ type: "noul" });
    expect(req.questions.category).toMatchObject({ type: "choice" });
    expect(req.questions.severity).toMatchObject({ type: "score" });
    expect(JSON.stringify(req.state)).toContain("<signalement_titre>");
  });
});

describe("parseJevResponse", () => {
  it("accepte une réponse valide", () => {
    const r = parseJevResponse(validResponse());
    expect(r.category).toBe("BUILDING");
    expect(r.severity).toBe("MEDIUM");
    expect(r.risks.insult).toBe(0.02);
  });
  it("rejette une catégorie inconnue", () => {
    const bad = validResponse();
    bad.answers.category.choice = "PROFESSOR";
    expect(() => parseJevResponse(bad)).toThrow();
  });
  it("rejette une probabilité hors bornes ou manquante", () => {
    const bad = validResponse() as { answers: Record<string, unknown> };
    bad.answers.insult = { noul: 1.7 };
    expect(() => parseJevResponse(bad)).toThrow();
    const missing = validResponse() as { answers: Record<string, unknown> };
    delete missing.answers.threat;
    expect(() => parseJevResponse(missing)).toThrow();
  });
});

describe("callJev", () => {
  it("sans clé → erreur de configuration", async () => {
    await expect(callJev({ ...config, apiKey: undefined }, input)).rejects.toMatchObject({ kind: "config" });
  });
  it("HTTP 500 → erreur http", async () => {
    const f = vi.fn().mockResolvedValue(new Response("oops", { status: 500 }));
    await expect(callJev(config, input, f)).rejects.toMatchObject({ kind: "http" });
  });
  it("JSON invalide → erreur invalid", async () => {
    const f = vi.fn().mockResolvedValue(new Response("pas du json", { status: 200 }));
    await expect(callJev(config, input, f)).rejects.toMatchObject({ kind: "invalid" });
  });
  it("structure inattendue → erreur invalid", async () => {
    const f = vi.fn().mockResolvedValue(Response.json({ publishable: true }));
    await expect(callJev(config, input, f)).rejects.toBeInstanceOf(JevError);
  });
  it("réponse valide → résultat typé, clé envoyée en Bearer", async () => {
    const f = vi.fn().mockResolvedValue(Response.json(validResponse()));
    const r = await callJev(config, input, f);
    expect(r.model).toBe("jev-1.13.0");
    expect(f.mock.calls[0]![1].headers.authorization).toBe("Bearer sk-test");
  });
});

describe("callJevGateway (passerelle Vercel)", () => {
  const gatewayResult = () => ({
    response: { modelId: "typesafe-ai/jev" },
    answers: {
      ...Object.fromEntries(RISK_KEYS.map((k) => [k, { type: "boolean", probability: 0.03 }])),
      category: { type: "choice", choice: "BUILDING", probabilities: { BUILDING: 0.91, OTHER: 0.09 } },
      severity: { type: "score", score: 1.1 },
    },
  });

  it("pose des questions « boolean » et convertit la réponse", async () => {
    const evaluate = vi.fn().mockResolvedValue(gatewayResult());
    const r = await callJevGateway({ model: "typesafe-ai/jev", timeoutMs: 1000 }, input, evaluate);
    expect(evaluate.mock.calls[0]![0].questions.insult.type).toBe("boolean");
    expect(r).toMatchObject({ model: "typesafe-ai/jev", category: "BUILDING", categoryConfidence: 0.91, severity: "MEDIUM" });
    expect(r.risks.threat).toBe(0.03);
  });

  it("erreur de la passerelle (offre gratuite, quota…) → JevError http", async () => {
    const evaluate = vi.fn().mockRejectedValue(new Error("Free tier users do not have access to this model."));
    await expect(callJevGateway({ model: "typesafe-ai/jev", timeoutMs: 1000 }, input, evaluate)).rejects.toMatchObject({ kind: "http" });
  });

  it("réponse inattendue → JevError invalid", async () => {
    const bad = gatewayResult() as { answers: Record<string, unknown> };
    bad.answers.selfHarm = { probability: 3 };
    const evaluate = vi.fn().mockResolvedValue(bad);
    await expect(callJevGateway({ model: "typesafe-ai/jev", timeoutMs: 1000 }, input, evaluate)).rejects.toMatchObject({ kind: "invalid" });
  });
});
