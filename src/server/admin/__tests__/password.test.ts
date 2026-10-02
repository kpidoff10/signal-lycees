import { describe, expect, it } from "vitest";
import { generatePassword, hashPassword, verifyPassword } from "../password";

describe("hashPassword / verifyPassword", () => {
  it("vérifie le bon mot de passe et refuse un mauvais", async () => {
    const h = await hashPassword("correct horse battery staple");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery staple", h)).toBe(true);
    expect(await verifyPassword("correct horse battery stapl", h)).toBe(false);
    expect(await verifyPassword("", h)).toBe(false);
  });

  it("utilise un sel aléatoire", async () => {
    const a = await hashPassword("même mot de passe !");
    const b = await hashPassword("même mot de passe !");
    expect(a).not.toBe(b);
    expect(await verifyPassword("même mot de passe !", a)).toBe(true);
    expect(await verifyPassword("même mot de passe !", b)).toBe(true);
  });

  it("refuse les hash mal formés sans lever d'exception", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$1$2$3$4$5")).toBe(false);
    expect(await verifyPassword("x", "scrypt$abc$8$1$AAAA$BBBB")).toBe(false);
    expect(await verifyPassword("x", "scrypt$99999999$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(88))).toBe(false);
  });

  it("refuse les mots de passe trop courts", async () => {
    await expect(hashPassword("court")).rejects.toThrow();
  });

  it("génère des mots de passe aléatoires suffisamment longs", () => {
    const p = generatePassword();
    expect(p.length).toBeGreaterThanOrEqual(24);
    expect(p).not.toBe(generatePassword());
  });
});
