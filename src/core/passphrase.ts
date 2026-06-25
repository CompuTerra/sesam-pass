import type { GenResult } from "./types";
import { detectCategories, SETS } from "./charset";
import { choiceBits, wordlistEntropyBits } from "./entropy";
import { pick, randomInt, sampleWithReplacement } from "./rng";

export interface PassphraseDecoration {
  /** Capitalize each word's first letter (adds the uppercase category, 0 added bits). */
  capitalize?: boolean;
  /** Insert one uniform digit at a random position. */
  digit?: boolean;
  /** Insert one uniform symbol at a random position. */
  symbol?: boolean;
  /** Symbol set to draw from when `symbol` is set (defaults to shell-safe). */
  symbolSet?: string;
}

export interface PassphraseOptions {
  readonly wordList: readonly string[];
  readonly words: number;
  readonly separator?: string;
  readonly decoration?: PassphraseDecoration;
}

/**
 * Generate a diceware passphrase. Words are picked uniformly with replacement.
 * Optional "decoration" makes the phrase satisfy composition rules (e.g. Windows
 * 3-of-5) while staying memorable; the added entropy is accounted for honestly.
 */
export function generatePassphrase(o: PassphraseOptions): GenResult {
  const count = Math.floor(o.words);
  if (count <= 0) throw new RangeError("generatePassphrase: words must be >= 1");
  if (o.wordList.length < 2) throw new RangeError("generatePassphrase: word list too small");

  const separator = o.separator ?? "-";
  const dec = o.decoration ?? {};

  let words = sampleWithReplacement(o.wordList, count);
  if (dec.capitalize) {
    words = words.map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w));
  }

  let phrase = words.join(separator);
  let extraBits = 0;
  const notes: string[] = [];

  const insertRandom = (ch: string, optionCount: number): void => {
    const positions = phrase.length + 1; // insertion slots: 0..len inclusive
    const pos = randomInt(positions);
    phrase = phrase.slice(0, pos) + ch + phrase.slice(pos);
    extraBits += choiceBits(optionCount) + choiceBits(positions);
  };

  if (dec.digit) {
    insertRandom(pick([...SETS.digit]), 10);
    notes.push("decorated:digit");
  }
  if (dec.symbol) {
    const symbolSet = dec.symbolSet && dec.symbolSet.length > 0 ? dec.symbolSet : SETS.symbolShellSafe;
    insertRandom(pick([...symbolSet]), symbolSet.length);
    notes.push("decorated:symbol");
  }

  const base = wordlistEntropyBits(o.wordList.length, count);

  return {
    secret: phrase,
    type: "passphrase",
    entropyBits: base + extraBits,
    entropyIsLowerBound: false,
    poolSize: o.wordList.length,
    unitCount: count,
    categories: detectCategories(phrase),
    notes,
  };
}
