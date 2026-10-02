import { describe, expect, it } from "vitest";
import { expiryFor, happenedOnFromChoice, isActive } from "../mobilization";

describe("mobilisations", () => {
  it("expire 72 h après le début du jour de la mobilisation", () => {
    expect(expiryFor(new Date("2026-10-01T15:30:00Z"), 72).toISOString()).toBe("2026-10-04T00:00:00.000Z");
  });
  it("dates déclarables : aujourd'hui, hier, avant-hier", () => {
    const now = new Date("2026-10-02T10:00:00Z");
    expect(happenedOnFromChoice("today", now).toISOString().slice(0, 10)).toBe("2026-10-02");
    expect(happenedOnFromChoice("2days", now).toISOString().slice(0, 10)).toBe("2026-09-30");
  });
  it("active seulement si publiée et non expirée", () => {
    const now = new Date("2026-10-02T10:00:00Z");
    expect(isActive({ status: "PUBLISHED", expiresAt: new Date("2026-10-03T00:00:00Z") }, now)).toBe(true);
    expect(isActive({ status: "PUBLISHED", expiresAt: new Date("2026-10-02T09:00:00Z") }, now)).toBe(false);
    expect(isActive({ status: "PENDING", expiresAt: new Date("2026-10-05T00:00:00Z") }, now)).toBe(false);
  });
});
