import { describe, it, expect, vi } from "vitest";
import { randomBytes, randomInt, pick, shuffleInPlace, sampleWithReplacement } from "../src/core/rng";

function chiSquare(counts: readonly number[], expected: number): number {
  return counts.reduce((acc, c) => acc + (c - expected) ** 2 / expected, 0);
}

describe("randomInt", () => {
  it("always returns a value in [0, maxExclusive)", () => {
    for (const k of [2, 3, 7, 10, 88, 94, 256, 7776]) {
      for (let i = 0; i < 2000; i++) {
        const v = randomInt(k);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(k);
      }
    }
  });

  it("is approximately uniform for awkward ranges (chi-square sanity)", () => {
    for (const k of [3, 7, 10, 88, 94]) {
      const N = 50000;
      const counts = new Array<number>(k).fill(0);
      for (let i = 0; i < N; i++) {
        const idx = randomInt(k);
        counts[idx]!++;
      }
      // Generous bound: a correct RNG passes essentially always; flags gross skew.
      expect(chiSquare(counts, N / k)).toBeLessThan((k - 1) * 3 + 30);
    }
  });

  it("rejects values in the biased tail (proves rejection sampling)", () => {
    const k = 7;
    const limit = Math.floor(2 ** 32 / k) * k; // 4294967292; tail = [limit, 2^32)
    const sequence = [limit, 10]; // first draw is in the tail → must be rejected, then 10
    let i = 0;
    const spy = vi
      .spyOn(globalThis.crypto, "getRandomValues")
      .mockImplementation(<T extends ArrayBufferView | null>(arr: T): T => {
        (arr as unknown as Uint32Array)[0] = sequence[i++]!;
        return arr;
      });
    expect(randomInt(k)).toBe(10 % k);
    expect(spy).toHaveBeenCalledTimes(2); // the tail draw was discarded, a second draw taken
    spy.mockRestore();
  });

  it("randomInt(1) is always 0", () => {
    for (let i = 0; i < 100; i++) expect(randomInt(1)).toBe(0);
  });

  it("throws on invalid input", () => {
    expect(() => randomInt(0)).toThrow();
    expect(() => randomInt(-1)).toThrow();
    expect(() => randomInt(1.5)).toThrow();
  });
});

describe("randomBytes", () => {
  it("returns the requested number of bytes (incl. multi-chunk)", () => {
    expect(randomBytes(0).length).toBe(0);
    expect(randomBytes(50).length).toBe(50);
    expect(randomBytes(70000).length).toBe(70000); // exceeds one getRandomValues call
  });
});

describe("pick / shuffleInPlace / sampleWithReplacement", () => {
  it("pick returns a member", () => {
    const arr = ["a", "b", "c"] as const;
    for (let i = 0; i < 50; i++) expect(arr).toContain(pick(arr));
  });
  it("shuffleInPlace yields a permutation", () => {
    const original = [...Array(100).keys()];
    const shuffled = shuffleInPlace([...original]);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(original);
  });
  it("sampleWithReplacement returns k items", () => {
    expect(sampleWithReplacement(["x"], 5)).toEqual(["x", "x", "x", "x", "x"]);
  });
  it("pick throws on empty array", () => {
    expect(() => pick([])).toThrow();
  });
});
