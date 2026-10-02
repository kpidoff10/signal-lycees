import { describe, expect, it } from "vitest";
import { buildTimeline } from "../timeline";

const d = (s: string) => new Date(`2026-${s}T12:00:00Z`);

describe("buildTimeline", () => {
  it("construit la timeline depuis les données", () => {
    const t = buildTimeline({
      createdAt: d("09-28"),
      events: [{ type: "STATUS_CHANGED", data: { from: "ACTIVE", to: "POSSIBLY_RESOLVED" }, createdAt: d("10-05") }],
      daily: [
        { day: d("09-28"), upTotal: 1, resolvedTotal: 0 },
        { day: d("09-29"), upTotal: 32, resolvedTotal: 0 },
        { day: d("09-30"), upTotal: 33, resolvedTotal: 0 },
        { day: d("09-30"), upTotal: 87, resolvedTotal: 0 },
        { day: d("10-02"), upTotal: 147, resolvedTotal: 12 },
      ],
    });
    expect(t.map((e) => e.text)).toEqual([
      "Premier signalement",
      "32 confirmations",
      "87 confirmations",
      "147 confirmations",
      "12 personnes indiquent que le problème semble résolu",
      "Plusieurs élèves indiquent que le problème semble résolu",
    ]);
  });
  it("ignore les petites variations", () => {
    const t = buildTimeline({ createdAt: d("09-28"), events: [], daily: [{ day: d("09-29"), upTotal: 2, resolvedTotal: 0 }] });
    expect(t).toHaveLength(1);
  });
});
