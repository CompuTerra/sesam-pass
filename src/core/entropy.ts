import type { CrackScenario, Strength, StrengthLabel } from "./types";

/** Entropy of a uniform random string: length · log2(poolSize). */
export function charsetEntropyBits(poolSize: number, length: number): number {
  if (poolSize <= 1 || length <= 0) return 0;
  return length * Math.log2(poolSize);
}

/** Entropy of a uniform passphrase: words · log2(listSize). */
export function wordlistEntropyBits(listSize: number, words: number): number {
  if (listSize <= 1 || words <= 0) return 0;
  return words * Math.log2(listSize);
}

/** Added entropy of one uniform choice among `n` options. */
export function choiceBits(n: number): number {
  return n > 1 ? Math.log2(n) : 0;
}

/**
 * Conservative LOWER BOUND on entropy when `k` positions of a length-`L` password
 * are forced to specific categories.
 *
 * The generation process is not uniform over pool^L, so the naive `L·log2(pool)`
 * is actually an UPPER bound. For an honest, never-overstated figure we condition
 * on a (worst-case known) choice of which positions are forced — conditioning can
 * only reduce entropy — leaving:
 *   - (L − k) free positions, each uniform over the full pool
 *   - one uniform pick per forced category (log2 of that category's size)
 * Given fixed positions these never collide, so this sum is a true lower bound.
 * (The omitted position-assignment entropy would add a little more.)
 */
export function forcedCategoryBits(
  length: number,
  poolSize: number,
  forcedCategorySizes: readonly number[],
): number {
  const k = forcedCategorySizes.length;
  if (k === 0) return charsetEntropyBits(poolSize, length);
  if (length < k || poolSize <= 1) return 0;

  let bits = (length - k) * Math.log2(poolSize);
  for (const size of forcedCategorySizes) bits += choiceBits(size);
  return bits;
}

export interface CrackAssumption {
  readonly scenario: string;
  readonly guessesPerSec: number;
}

/** Two named, transparent attacker assumptions (worst-case framing). */
export const DEFAULT_SCENARIOS: readonly CrackAssumption[] = [
  { scenario: "online_throttled", guessesPerSec: 1e2 },
  { scenario: "offline_gpu", guessesPerSec: 1e11 },
];

function labelFor(bits: number): StrengthLabel {
  if (bits < 50) return "very-weak";
  if (bits < 70) return "weak";
  if (bits < 100) return "fair";
  if (bits < 128) return "strong";
  return "very-strong";
}

/**
 * Map entropy to a strength label and per-scenario crack times.
 * Expected guesses ≈ 2^(bits−1). Seconds may be astronomically large (the UI caps
 * the displayed value); below 50 bits is flagged as a hard floor breach.
 */
export function strengthFromBits(
  bits: number,
  scenarios: readonly CrackAssumption[] = DEFAULT_SCENARIOS,
): Strength {
  const expectedGuesses = Math.pow(2, Math.max(0, bits - 1));
  const crackTimes: CrackScenario[] = scenarios.map((s) => ({
    scenario: s.scenario,
    guessesPerSec: s.guessesPerSec,
    seconds: expectedGuesses / s.guessesPerSec,
  }));
  return { bits, label: labelFor(bits), belowFloor: bits < 50, crackTimes };
}
