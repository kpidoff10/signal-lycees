import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.stubEnv("RATE_LIMIT_MULTIPLIER", "1");
import { LIMITS, MemoryLimiter } from "../rate-limit";

describe("MemoryLimiter", () => {
  it("bloque au-delà du quota puis libère après la fenêtre", async () => {
    const l = new MemoryLimiter();
    const [max, windowSec] = LIMITS.submit;
    const t0 = 1_000_000;
    for (let i = 0; i < max; i++) expect((await l.limit("submit", "ip1", t0 + i)).ok).toBe(true);
    expect((await l.limit("submit", "ip1", t0 + max)).ok).toBe(false);
    expect((await l.limit("submit", "ip2", t0 + max)).ok).toBe(true);
    expect((await l.limit("submit", "ip1", t0 + windowSec * 1000 + 10)).ok).toBe(true);
  });
});
