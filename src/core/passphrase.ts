import type { GenResult } from "./types";
import { detectCategories, SETS } from "./charset";
import { choiceBits, wordlistEntropyBits } from "./entropy";
import { pick, sampleWithReplacement } from "./rng";

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

  // Append digits/symbols directly onto the last word (e.g. "Tisch-Apfel-Regen7!")
  // so the phrase stays memorable while still satisfying composition rules.
  const digitCount = Math.max(0, Math.floor(dec.digitCount ?? 0));
  const symbolCount = Math.max(0, Math.floor(dec.symbolCount ?? 0));
  const symbolSet = dec.symbolSet && dec.symbolSet.length > 0 ? dec.symbolSet : SETS.symbolShellSafe;

  if (digitCount > 0 || symbolCount > 0) {
    let tail = "";
    for (let i = 0; i < digitCount; i++) {
      tail += pick([...SETS.digit]);
      extraBits += choiceBits(10);
    }
    for (let i = 0; i < symbolCount; i++) {
      tail += pick([...symbolSet]);
      extraBits += choiceBits(symbolSet.length);
    }
    phrase += tail;
    if (digitCount > 0) notes.push(`appended:digit:${digitCount}`);
    if (symbolCount > 0) notes.push(`appended:symbol:${symbolCount}`);
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
