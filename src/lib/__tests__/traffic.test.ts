import { describe, expect, it } from "vitest";
import { countablePath, isBot, isOutreachCode, newOutreachCode, parisDay, sourceFromCampaign, sourceFromReferrer } from "../traffic";

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
  it("reconnaît nos liens de partage et le QR code des affiches, et seulement eux", () => {
    expect(sourceFromCampaign("affiche")).toBe("Affiche (QR code)");
    expect(sourceFromCampaign("n'importe quoi")).toBeNull();
    expect(sourceFromCampaign(undefined)).toBeNull();
    expect(sourceFromCampaign({})).toBeNull();
    expect(sourceFromCampaign("eqaqj")).toBe("Lien · Instagram (bio)");
    expect(sourceFromCampaign("rh38a")).toBe("Affiche (QR code)");
    expect(sourceFromCampaign("insta-bio")).toBeNull();
    expect(sourceFromCampaign("constructor")).toBeNull();
    expect(sourceFromCampaign("__proto__")).toBeNull();
  });
  it("jour à l'heure de Paris", () => {
    expect(parisDay(new Date("2026-10-01T22:30:00Z"))).toBe("2026-10-02");
  });
  it("reconnaît les codes personnels des contacts, sans les confondre avec les liens de partage", () => {
    const code = newOutreachCode();
    expect(code).toMatch(/^[a-z2-9]{6}$/);
    expect(isOutreachCode(code)).toBe(true);
    expect(isOutreachCode("k5zf4")).toBe(false); // lien de partage « Mail presse »
    expect(isOutreachCode("rh38a")).toBe(false); // QR code des affiches
    expect(isOutreachCode("ABCDEF")).toBe(false);
    expect(isOutreachCode("abc")).toBe(false);
  });
});
