import { describe, it, expect } from "vitest";
import { generatePassword, generatePin } from "../src/core/generator";

describe("generatePassword", () => {
  it("respects the requested length", () => {
    for (const len of [4, 16, 64, 128]) {
      const r = generatePassword({ length: len, lower: true, upper: true, digit: true, symbols: "full" });
      expect(r.secret.length).toBe(len);
    }
  });

  it("only uses pool characters and honors excludeAmbiguous", () => {
    const r = generatePassword({
      length: 300,
      lower: true,
      upper: true,
      digit: true,
      symbols: "none",
      excludeAmbiguous: true,
    });
    expect(r.secret).toMatch(/^[A-Za-z0-9]+$/);
    expect(r.secret).not.toMatch(/[0O1lI|]/);
  });

  it("guarantees required categories and marks entropy as a lower bound", () => {
    for (let i = 0; i < 300; i++) {
      const r = generatePassword({
        length: 8,
        lower: true,
        upper: true,
        digit: true,
        symbols: "shellsafe",
        requireCategories: ["lower", "upper", "digit"],
      });
      expect(r.categories.has("lower")).toBe(true);
      expect(r.categories.has("upper")).toBe(true);
      expect(r.categories.has("digit")).toBe(true);
      expect(r.entropyIsLowerBound).toBe(true);
    }
  });

  it("throws on an empty pool", () => {
    expect(() => generatePassword({ length: 8 })).toThrow();
  });

  it("throws when more categories are required than characters", () => {
    expect(() =>
      generatePassword({
        length: 2,
        lower: true,
        upper: true,
        digit: true,
        requireCategories: ["lower", "upper", "digit"],
      }),
    ).toThrow();
  });
});

describe("generatePin", () => {
  it("is digits-only with the right length and entropy", () => {
    const r = generatePin(6);
    expect(r.secret).toMatch(/^[0-9]{6}$/);
    expect(r.entropyBits).toBeCloseTo(6 * Math.log2(10), 6);
    expect(r.categories.has("digit")).toBe(true);
  });
});
