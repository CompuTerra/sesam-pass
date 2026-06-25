import { describe, it, expect } from "vitest";
import {
  charsetEntropyBits,
  wordlistEntropyBits,
  forcedCategoryBits,
  strengthFromBits,
} from "../src/core/entropy";

describe("entropy math", () => {
  it("charset entropy = length * log2(pool)", () => {
    expect(charsetEntropyBits(94, 16)).toBeCloseTo(16 * Math.log2(94), 6);
    expect(charsetEntropyBits(62, 12)).toBeCloseTo(12 * Math.log2(62), 6);
    expect(charsetEntropyBits(1, 10)).toBe(0);
  });

  it("passphrase entropy matches EFF references", () => {
    expect(wordlistEntropyBits(7776, 6)).toBeCloseTo(77.549, 2);
    expect(wordlistEntropyBits(7776, 8)).toBeCloseTo(103.399, 2);
    expect(wordlistEntropyBits(7776, 10)).toBeCloseTo(129.248, 2);
  });

  it("forcedCategoryBits is a conservative lower bound vs naive", () => {
    const naive = charsetEntropyBits(70, 16);
    const forced = forcedCategoryBits(16, 70, [25, 24, 8]);
    expect(forced).toBeLessThanOrEqual(naive);
    expect(forced).toBeGreaterThan(90); // still strong (~91.9 bits)
  });

  it("forcedCategoryBits with no forced categories equals the naive value", () => {
    expect(forcedCategoryBits(16, 70, [])).toBeCloseTo(charsetEntropyBits(70, 16), 6);
  });

  it("strength labels and floor", () => {
    expect(strengthFromBits(30).label).toBe("very-weak");
    expect(strengthFromBits(30).belowFloor).toBe(true);
    expect(strengthFromBits(60).label).toBe("weak");
    expect(strengthFromBits(85).label).toBe("fair");
    expect(strengthFromBits(110).label).toBe("strong");
    expect(strengthFromBits(130).label).toBe("very-strong");
    expect(strengthFromBits(130).belowFloor).toBe(false);
  });

  it("crack time has both scenarios and grows with bits", () => {
    const weak = strengthFromBits(40);
    const strong = strengthFromBits(120);
    expect(weak.crackTimes.length).toBe(2);
    expect(strong.crackTimes[1]!.seconds).toBeGreaterThan(weak.crackTimes[1]!.seconds);
  });
});
