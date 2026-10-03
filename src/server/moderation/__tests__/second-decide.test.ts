import { describe, expect, it } from "vitest";
import { applySecondOpinion, isEligibleForSecondOpinion, keptWordsRatio } from "../second-decide";
import { runRules } from "../rules";
import type { DecisionResult } from "../decide";
import type { JevResult } from "../jev";

const original = {
  title: "Chauffage en panne en salle B12",
  description: "Depuis trois semaines le chauffage ne marche plus en salle B12, M. Dupont nous fait cours en manteau et on a froid.",
};
const review: DecisionResult = { decision: "MANUAL_REVIEW", priority: "ELEVATED", showHelp: false, reason: "Règles déclenchées : NAMED_PERSON.", flags: [] };
const jev = { risks: {}, category: "BUILDING", severity: "MEDIUM" } as unknown as JevResult;

describe("second avis sur les signalements", () => {
  it("ne concerne que la revue humaine non urgente", () => {
    expect(isEligibleForSecondOpinion(review, jev, [])).toBe(true);
    expect(isEligibleForSecondOpinion({ ...review, priority: "URGENT" }, jev, [])).toBe(false);
    expect(isEligibleForSecondOpinion({ ...review, showHelp: true }, jev, [])).toBe(false);
    expect(isEligibleForSecondOpinion({ ...review, decision: "AUTO_APPROVED" }, jev, [])).toBe(false);
    expect(isEligibleForSecondOpinion(review, null, [])).toBe(false);
    expect(isEligibleForSecondOpinion(review, jev, [{ code: "INJECTION", level: "hard", match: "x" }])).toBe(false);
    expect(isEligibleForSecondOpinion({ ...review, reason: "Publication automatique suspendue (interrupteur d'urgence)." }, jev, [])).toBe(false);
  });

  it("laisse toujours à la modération un reproche visant le comportement d'une personne", () => {
    const withRisks = (risks: Record<string, number>) => ({ ...jev, risks }) as unknown as JevResult;
    expect(isEligibleForSecondOpinion(review, withRisks({ harassment: 0.68, defamation: 0.87, insult: 0.64 }), [])).toBe(false);
    expect(isEligibleForSecondOpinion(review, withRisks({ insult: 0.5 }), [])).toBe(false);
    expect(isEligibleForSecondOpinion(review, withRisks({ defamation: 0.57, harassment: 0.17, namedPerson: 0.85 }), [])).toBe(true);
  });

  it("publie tel quel, ou laisse la revue humaine en cas de doute", () => {
    expect(applySecondOpinion(original, { verdict: "publish", reason: "ok" }, runRules)).toMatchObject({ action: "publish", rephrased: false });
    expect(applySecondOpinion(original, { verdict: "review", reason: "doute" }, runRules).action).toBe("review");
    expect(applySecondOpinion(original, null, runRules).action).toBe("review");
  });

  it("accepte une reformulation légère qui retire le nom", () => {
    const d = applySecondOpinion(
      original,
      {
        verdict: "rephrase",
        title: original.title,
        description: "Depuis trois semaines le chauffage ne marche plus en salle B12, les cours se font en manteau et on a froid.",
        reason: "nom retiré",
      },
      runRules,
    );
    expect(d).toMatchObject({ action: "publish", rephrased: true });
  });

  it("refuse une reformulation qui garde le nom ou réécrit tout", () => {
    expect(
      applySecondOpinion(original, { verdict: "rephrase", title: original.title, description: original.description.replace("on a froid", "il fait froid"), reason: "x" }, runRules).action,
    ).toBe("review");
    expect(
      applySecondOpinion(
        original,
        { verdict: "rephrase", title: "Problème thermique signalé", description: "Une défaillance du système thermique est constatée dans un local d'enseignement.", reason: "x" },
        runRules,
      ).action,
    ).toBe("review");
    expect(applySecondOpinion(original, { verdict: "rephrase", title: "Court", description: original.description, reason: "x" }, runRules).action).toBe("review");
  });

  it("mesure la part de mots conservés", () => {
    expect(keptWordsRatio("le chauffage est en panne", "le chauffage est en panne")).toBe(1);
    expect(keptWordsRatio("le chauffage est en panne", "défaillance thermique")).toBe(0);
  });
});
