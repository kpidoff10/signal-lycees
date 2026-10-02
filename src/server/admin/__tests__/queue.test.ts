import { describe, expect, it } from "vitest";
import { queueRank, sortQueue, type QueueSortable } from "../queue";

const d = (day: number) => new Date(Date.UTC(2026, 9, day));
const item = (id: string, over: Partial<QueueSortable>): QueueSortable => ({
  id,
  reviewPriority: "NORMAL",
  flaggedForReview: false,
  openReports: 0,
  createdAt: d(1),
  ...over,
});

describe("file de modération", () => {
  it("rangs", () => {
    expect(queueRank(item("a", { reviewPriority: "URGENT", flaggedForReview: true }))).toBe(0);
    expect(queueRank(item("a", { reviewPriority: "ELEVATED" }))).toBe(1);
    expect(queueRank(item("a", { flaggedForReview: true }))).toBe(2);
    expect(queueRank(item("a", { openReports: 2 }))).toBe(2);
    expect(queueRank(item("a", {}))).toBe(3);
  });

  it("URGENT, puis ELEVATED, puis signalés, puis le reste par ancienneté", () => {
    const sorted = sortQueue([
      item("normal-recent", { createdAt: d(5) }),
      item("reported", { openReports: 1, createdAt: d(6) }),
      item("elevated", { reviewPriority: "ELEVATED", createdAt: d(2) }),
      item("normal-old", { createdAt: d(1) }),
      item("urgent-recent", { reviewPriority: "URGENT", createdAt: d(9) }),
      item("flagged", { flaggedForReview: true, createdAt: d(3) }),
      item("urgent-old", { reviewPriority: "URGENT", createdAt: d(4) }),
    ]);
    expect(sorted.map((i) => i.id)).toEqual([
      "urgent-old",
      "urgent-recent",
      "elevated",
      "flagged",
      "reported",
      "normal-old",
      "normal-recent",
    ]);
  });

  it("ordre stable à date égale", () => {
    expect(sortQueue([item("b", {}), item("a", {})]).map((i) => i.id)).toEqual(["a", "b"]);
  });
});
