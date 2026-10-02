import { describe, expect, it } from "vitest";
import { base32Decode, base32Encode, generateTotpSecret, hotp, otpauthUri, totp, verifyTotp } from "../totp";

// Annexe B de la RFC 6238 (8 chiffres, pas de 30 s).
const SEEDS = {
  sha1: Buffer.from("12345678901234567890", "ascii"),
  sha256: Buffer.from("12345678901234567890123456789012", "ascii"),
  sha512: Buffer.from("1234567890123456789012345678901234567890123456789012345678901234", "ascii"),
} as const;

const VECTORS: [number, string, string, string][] = [
  [59, "94287082", "46119246", "90693936"],
  [1111111109, "07081804", "68084774", "25091201"],
  [1111111111, "14050471", "67062674", "99943326"],
  [1234567890, "89005924", "91819424", "93441116"],
  [2000000000, "69279037", "90698825", "38618901"],
  [20000000000, "65353130", "77737706", "47863826"],
];

describe("TOTP RFC 6238", () => {
  it.each(VECTORS)("T=%i", (t, sha1, sha256, sha512) => {
    expect(totp(SEEDS.sha1, t, { digits: 8, algorithm: "sha1" })).toBe(sha1);
    expect(totp(SEEDS.sha256, t, { digits: 8, algorithm: "sha256" })).toBe(sha256);
    expect(totp(SEEDS.sha512, t, { digits: 8, algorithm: "sha512" })).toBe(sha512);
  });

  it("HOTP RFC 4226 (annexe D)", () => {
    const expected = ["755224", "287082", "359152", "969429", "338314", "254676", "287922", "162583", "399871", "520489"];
    expected.forEach((code, i) => expect(hotp(SEEDS.sha1, i)).toBe(code));
  });
});

describe("base32", () => {
  it("vecteurs RFC 4648", () => {
    expect(base32Encode(Buffer.from("foobar"))).toBe("MZXW6YTBOI");
    expect(base32Decode("MZXW6YTBOI======").toString()).toBe("foobar");
    expect(base32Decode("mzxw 6ytb oi").toString()).toBe("foobar");
  });
  it("aller-retour d'un secret généré", () => {
    const s = generateTotpSecret();
    expect(s).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Encode(base32Decode(s))).toBe(s);
  });
  it("rejette les caractères invalides", () => {
    expect(() => base32Decode("ABC1")).toThrow();
  });
});

describe("verifyTotp", () => {
  const secret = base32Encode(SEEDS.sha1);
  const now = 1_111_111_111_000;
  const code = totp(SEEDS.sha1, 1_111_111_111);

  it("accepte le code courant et ceux à ±30 s", () => {
    expect(verifyTotp(secret, code, now)).toBe(true);
    expect(verifyTotp(secret, code, now + 30_000)).toBe(true);
    expect(verifyTotp(secret, code, now - 30_000)).toBe(true);
    expect(verifyTotp(secret, code.slice(0, 3) + " " + code.slice(3), now)).toBe(true);
  });
  it("refuse un code trop ancien, mal formé ou faux", () => {
    expect(verifyTotp(secret, code, now + 120_000)).toBe(false);
    expect(verifyTotp(secret, "12345", now)).toBe(false);
    expect(verifyTotp(secret, "abcdef", now)).toBe(false);
    expect(verifyTotp(secret, code === "000000" ? "000001" : "000000", now)).toBe(false);
    expect(verifyTotp("!!!", code, now)).toBe(false);
  });
  it("construit une URI otpauth", () => {
    const uri = otpauthUri("JBSWY3DPEHPK3PXP", "kevin");
    expect(uri.startsWith("otpauth://totp/Signal%20Lyc%C3%A9es%3Akevin?")).toBe(true);
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
  });
});
