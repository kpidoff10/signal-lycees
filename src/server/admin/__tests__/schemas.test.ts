import { describe, expect, it } from "vitest";
import { REFUSAL_REASONS } from "../labels";
import { rejectSchema, schoolEditSchema } from "../schemas";

describe("rejectSchema", () => {
  it("motif type → texte public correspondant", () => {
    const r = rejectSchema.parse({ issueId: "abc123", reasonCode: "INSULT" });
    expect(r.publicReason).toBe(REFUSAL_REASONS.INSULT);
    expect(r.internalReason).toBeUndefined();
  });
  it("motif « Autre » exige un texte", () => {
    expect(rejectSchema.safeParse({ issueId: "abc123", reasonCode: "OTHER", reasonText: "court" }).success).toBe(false);
    const ok = rejectSchema.parse({ issueId: "abc123", reasonCode: "OTHER", reasonText: "Motif rédigé à la main." });
    expect(ok.publicReason).toBe("Motif rédigé à la main.");
  });
  it("refuse un motif inconnu ou un id invalide", () => {
    expect(rejectSchema.safeParse({ issueId: "abc123", reasonCode: "NOPE" }).success).toBe(false);
    expect(rejectSchema.safeParse({ issueId: "a b", reasonCode: "INSULT" }).success).toBe(false);
  });
});

describe("schoolEditSchema", () => {
  const base = { schoolId: "s1", name: "Lycée Test", postalCode: "75001", city: "Paris", latitude: "48,85", longitude: "2.35" };
  it("accepte des coordonnées avec virgule et une case non cochée", () => {
    const r = schoolEditSchema.parse(base);
    expect(r.latitude).toBe(48.85);
    expect(r.isOpen).toBe(false);
  });
  it("refuse des coordonnées vides ou hors bornes", () => {
    expect(schoolEditSchema.safeParse({ ...base, latitude: "" }).success).toBe(false);
    expect(schoolEditSchema.safeParse({ ...base, longitude: "200" }).success).toBe(false);
    expect(schoolEditSchema.safeParse({ ...base, latitude: "abc" }).success).toBe(false);
  });
});
