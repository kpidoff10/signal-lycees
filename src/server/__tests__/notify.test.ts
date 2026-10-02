import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: () => {} }));
vi.mock("@/lib/db", () => ({ prisma: {} }));
import { formatNotification } from "../notify";

const info = { school: "Lycée <Test>", city: "Dijon", category: "BUILDING" as const };
const url = "https://signal-lycees.fr";

describe("formatNotification", () => {
  it("signalement urgent : lien vers la file, mention détresse", () => {
    const t = formatNotification({ type: "issue", issueId: "abc", status: "MANUAL_REVIEW", priority: "URGENT", showHelp: true }, info, url)!;
    expect(t).toContain("URGENT");
    expect(t).toContain("détresse");
    expect(t).toContain("https://signal-lycees.fr/admin/moderation");
  });
  it("échappe le HTML et ne contient que lycée, ville et catégorie", () => {
    const t = formatNotification({ type: "issue", issueId: "abc", status: "MANUAL_REVIEW", priority: "NORMAL" }, info, url)!;
    expect(t).toContain("Lycée &lt;Test&gt; (Dijon)");
    expect(t).toContain("Locaux");
  });
  it("publication : lien vers la fiche admin du problème", () => {
    expect(formatNotification({ type: "issue", issueId: "abc", status: "PUBLISHED", priority: "NORMAL" }, info, url)).toContain("/admin/issues/abc");
  });
  it("refus automatique : pas de notification", () => {
    expect(formatNotification({ type: "issue", issueId: "abc", status: "REJECTED", priority: "NORMAL" }, info, url)).toBeNull();
  });
  it("demande de suppression", () => {
    expect(formatNotification({ type: "privacy", kind: "DELETION", linked: true }, null, url)).toContain("Demande de suppression");
  });
});
