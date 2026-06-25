import type { GenResult } from "./types";
import { detectCategories, SETS } from "./charset";
import { choiceBits, wordlistEntropyBits } from "./entropy";
import { pick, randomInt, sampleWithReplacement } from "./rng";

export interface PassphraseDecoration {
  /** Capitalize each word's first letter (adds the uppercase category, 0 added bits). */
  capitalize?: boolean;
  /** Number of uniform digits to insert at random positions (default 0). */
  digitCount?: number;
  /** Number of uniform symbols to insert at random positions (default 0). */
  symbolCount?: number;
  /** Symbol set to draw from for inserted symbols (defaults to shell-safe). */
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

  const digitCount = Math.max(0, Math.floor(dec.digitCount ?? 0));
  for (let i = 0; i < digitCount; i++) insertRandom(pick([...SETS.digit]), 10);
  if (digitCount > 0) notes.push(`decorated:digit:${digitCount}`);

  const symbolSet = dec.symbolSet && dec.symbolSet.length > 0 ? dec.symbolSet : SETS.symbolShellSafe;
  const symbolCount = Math.max(0, Math.floor(dec.symbolCount ?? 0));
  for (let i = 0; i < symbolCount; i++) insertRandom(pick([...symbolSet]), symbolSet.length);
  if (symbolCount > 0) notes.push(`decorated:symbol:${symbolCount}`);

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
