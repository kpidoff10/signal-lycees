import { beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

beforeAll(() => {
  process.env.APP_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.DATABASE_URL ??= "postgresql://test@localhost/test";
});

const { createSessionToken, passwordVersion, SESSION_TTL_SEC, verifySessionToken } = await import("../session");

describe("session admin", () => {
  const now = Date.UTC(2026, 9, 2, 12);

  it("signe puis vérifie un jeton", () => {
    const t = createSessionToken("admin1", "scrypt$hash", now);
    const p = verifySessionToken(t, now + 1000);
    expect(p?.sub).toBe("admin1");
    expect(p?.exp).toBe(Math.floor(now / 1000) + SESSION_TTL_SEC);
    expect(p?.pwv).toBe(passwordVersion("scrypt$hash"));
  });

  it("expire après 8 h", () => {
    const t = createSessionToken("admin1", "h", now);
    expect(verifySessionToken(t, now + 8 * 3600_000 - 1000)).not.toBeNull();
    expect(verifySessionToken(t, now + 8 * 3600_000)).toBeNull();
  });

  it("refuse un jeton modifié ou mal formé", () => {
    const t = createSessionToken("admin1", "h", now);
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "admin2", exp: 9_999_999_999, pwv: "x" })).toString("base64url");
    expect(verifySessionToken(`${forged}.${sig}`, now)).toBeNull();
    expect(verifySessionToken(`${body}.${sig}x`, now)).toBeNull();
    expect(verifySessionToken(`${body}`, now)).toBeNull();
    expect(verifySessionToken("", now)).toBeNull();
    expect(verifySessionToken(undefined, now)).toBeNull();
    expect(verifySessionToken(`${body}.${sig}.extra`, now)).toBeNull();
  });

  it("l'empreinte change avec le mot de passe", () => {
    expect(passwordVersion("a")).not.toBe(passwordVersion("b"));
  });
});
