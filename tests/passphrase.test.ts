import { describe, it, expect } from "vitest";
import { generatePassphrase } from "../src/core/passphrase";
import { loadWordList } from "../src/core/wordlists";

const SYN = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel"] as const;

describe("generatePassphrase", () => {
  it("produces the requested number of words", () => {
    const r = generatePassphrase({ wordList: SYN, words: 5, separator: "-" });
    expect(r.secret.split("-").length).toBe(5);
    expect(r.unitCount).toBe(5);
    expect(r.type).toBe("passphrase");
  });

  it("entropy = words * log2(listSize)", () => {
    const r = generatePassphrase({ wordList: SYN, words: 4 });
    expect(r.entropyBits).toBeCloseTo(4 * Math.log2(SYN.length), 6);
  });

  it("decoration adds upper/digit/symbol categories and extra entropy", () => {
    const base = generatePassphrase({ wordList: SYN, words: 4, separator: "_" });
    const decorated = generatePassphrase({
      wordList: SYN,
      words: 4,
      separator: "_",
      decoration: { capitalize: true, digitCount: 1, symbolCount: 1, symbolSet: "!#$" },
    });
    expect(decorated.categories.has("upper")).toBe(true);
    expect(decorated.categories.has("digit")).toBe(true);
    expect(decorated.categories.has("symbol")).toBe(true);
    expect(decorated.entropyBits).toBeGreaterThan(base.entropyBits);
  });

  it("inserts the requested number of digits and adds more entropy with higher counts", () => {
    const r2 = generatePassphrase({ wordList: SYN, words: 4, separator: "_", decoration: { digitCount: 2 } });
    expect((r2.secret.match(/[0-9]/g) ?? []).length).toBe(2);
    const r3 = generatePassphrase({ wordList: SYN, words: 4, separator: "_", decoration: { digitCount: 3 } });
    expect((r3.secret.match(/[0-9]/g) ?? []).length).toBe(3);
    expect(r3.entropyBits).toBeGreaterThan(r2.entropyBits);
  });

  it("works with the real German list (7776 words, ~77.5 bits at 6 words)", async () => {
    const wl = await loadWordList("de");
    expect(wl.words.length).toBe(7776);
    const r = generatePassphrase({ wordList: wl.words, words: 6 });
    expect(r.entropyBits).toBeCloseTo(77.549, 1);
  });

  it("throws on degenerate input", () => {
    expect(() => generatePassphrase({ wordList: SYN, words: 0 })).toThrow();
    expect(() => generatePassphrase({ wordList: ["x"], words: 3 })).toThrow();
  });
});
