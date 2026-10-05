import { describe, expect, it } from "vitest";
import { decideVerification } from "../verification";

describe("vérification d'une mobilisation par l'IA", () => {
  const ok = { confirmed: true, verdict: "publish" as const, reason: "l'article cite le lycée fermé lundi" };
  it("publie seulement une confirmation explicite", () => {
    expect(decideVerification(ok).status).toBe("PUBLISHED");
    expect(decideVerification({ ...ok, confirmed: false }).status).toBe("PENDING");
  });
  it("refuse quand l'IA infirme, garde à valider quand elle doute ou est indisponible", () => {
    expect(decideVerification({ ...ok, confirmed: false, verdict: "reject" }).status).toBe("REJECTED");
    expect(decideVerification({ ...ok, verdict: "unsure" }).status).toBe("PENDING");
    expect(decideVerification(null).status).toBe("PENDING");
  });
  it("garde la raison de l'IA dans la note", () => {
    expect(decideVerification(ok).note).toContain("fermé lundi");
  });
});
