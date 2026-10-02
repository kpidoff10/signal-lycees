import { describe, expect, it } from "vitest";
import { countablePath, isBot, parisDay, sourceFromReferrer } from "../traffic";

describe("fréquentation", () => {
  it("ignore les robots", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("facebookexternalhit/1.1")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1")).toBe(false);
  });
  it("ne compte que les pages publiques, jamais l'admin ni les liens de suivi", () => {
    expect(countablePath("/lycee/lycee-carnot-dijon?x=1")).toBe("/lycee/lycee-carnot-dijon");
    expect(countablePath("/")).toBe("/");
    expect(countablePath("/admin/moderation")).toBeNull();
    expect(countablePath("/suivi/abcdef")).toBeNull();
    expect(countablePath("https://evil.com")).toBeNull();
    expect(countablePath("/<script>")).toBeNull();
  });
  it("résume la provenance", () => {
    expect(sourceFromReferrer("https://www.snapchat.com/", "signal-lycees.fr")).toBe("Snapchat");
    expect(sourceFromReferrer("https://l.instagram.com/?u=x", "signal-lycees.fr")).toBe("Instagram");
    expect(sourceFromReferrer("https://www.google.fr/", "signal-lycees.fr")).toBe("Google");
    expect(sourceFromReferrer("https://signal-lycees.fr/lycee/x", "signal-lycees.fr")).toBe("Direct");
    expect(sourceFromReferrer("", "signal-lycees.fr")).toBe("Direct");
    expect(sourceFromReferrer("https://www.letudiant.fr/article", "signal-lycees.fr")).toBe("letudiant.fr");
  });
  it("jour à l'heure de Paris", () => {
    expect(parisDay(new Date("2026-10-01T22:30:00Z"))).toBe("2026-10-02");
  });
});
