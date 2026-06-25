import type { GenResult } from "./types";
import { detectCategories } from "./charset";
import { choiceBits } from "./entropy";
import { pick } from "./rng";

/**
 * Simple pronounceable generator (alternating consonant/vowel syllables).
 * This is materially WEAKER than a random password — the entropy below is honest
 * and low, and the UI must warn about it.
 */
const CONSONANTS = [..."bcdfghjklmnprstvwz"];
const VOWELS = [..."aeiou"];
const DIGITS = [..."0123456789"];

export interface PronounceableOptions {
  syllables: number;
  capitalize?: boolean;
  digits?: number;
}

export function generatePronounceable(o: PronounceableOptions): GenResult {
  const syllables = Math.max(1, Math.floor(o.syllables));
  let out = "";
  for (let i = 0; i < syllables; i++) out += pick(CONSONANTS) + pick(VOWELS);

  let bits = syllables * (choiceBits(CONSONANTS.length) + choiceBits(VOWELS.length));

  const digits = Math.max(0, Math.floor(o.digits ?? 0));
  for (let i = 0; i < digits; i++) {
    out += pick(DIGITS);
    bits += choiceBits(DIGITS.length);
  }
  if (o.capitalize && out.length > 0) out = out.charAt(0).toUpperCase() + out.slice(1);

  return {
    secret: out,
    type: "password",
    entropyBits: bits,
    entropyIsLowerBound: false,
    poolSize: CONSONANTS.length * VOWELS.length,
    unitCount: syllables,
    categories: detectCategories(out),
    notes: ["pronounceable"],
  };
}
