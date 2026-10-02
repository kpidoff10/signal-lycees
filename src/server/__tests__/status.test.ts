import { describe, expect, it } from "vitest";
import { crossedMilestone, needsDownvoteReview, nextStatus } from "../status";

const now = new Date("2026-10-02T12:00:00Z");
const base = { statusChangedAt: new Date("2026-09-01T00:00:00Z"), recentUp: 0, recentResolved: 0, upSinceStatusChange: 0, now };

describe("nextStatus", () => {
  it("un seul vote « résolu » ne change rien", () => {
    expect(nextStatus({ ...base, status: "ACTIVE", recentResolved: 1 })).toBe("ACTIVE");
  });
  it("assez de votes « résolu » récents → POSSIBLY_RESOLVED", () => {
    expect(nextStatus({ ...base, status: "ACTIVE", recentResolved: 3, recentUp: 4 })).toBe("POSSIBLY_RESOLVED");
  });
  it("beaucoup de confirmations récentes empêchent le passage", () => {
    expect(nextStatus({ ...base, status: "ACTIVE", recentResolved: 3, recentUp: 20 })).toBe("ACTIVE");
  });
  it("nouvelles confirmations → retour en ACTIVE", () => {
    expect(nextStatus({ ...base, status: "POSSIBLY_RESOLVED", statusChangedAt: now, upSinceStatusChange: 2 })).toBe("ACTIVE");
  });
  it("RESOLVED automatique après 21 jours sans confirmation", () => {
    expect(nextStatus({ ...base, status: "POSSIBLY_RESOLVED" })).toBe("RESOLVED");
    expect(nextStatus({ ...base, status: "POSSIBLY_RESOLVED", statusChangedAt: new Date("2026-09-25T00:00:00Z") })).toBe("POSSIBLY_RESOLVED");
  });
  it("RESOLVED est définitif", () => {
    expect(nextStatus({ ...base, status: "RESOLVED", upSinceStatusChange: 10 })).toBe("RESOLVED");
  });
});

describe("👎 pas sérieux", () => {
  it("quelques 👎 ne déclenchent rien", () => {
    expect(needsDownvoteReview(100, 4)).toBe(false);
    expect(needsDownvoteReview(100, 10)).toBe(false);
  });
  it("beaucoup de 👎 relatifs → revue", () => {
    expect(needsDownvoteReview(3, 6)).toBe(true);
  });
});

describe("paliers de confirmations", () => {
  it("détecte le franchissement", () => {
    expect(crossedMilestone(9, 10)).toBe(10);
    expect(crossedMilestone(10, 11)).toBeNull();
    expect(crossedMilestone(99, 100)).toBe(100);
  });
});
