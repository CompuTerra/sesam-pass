/** Shared, DOM-free types for the generation core. */

export type CharCategory = "lower" | "upper" | "digit" | "symbol";
export type OutputType = "password" | "passphrase" | "pin";
export type Lang = "de" | "en";

/** The result of one generation, with honest, structured entropy metadata. */
export interface GenResult {
  readonly secret: string;
  readonly type: OutputType;
  /** Exact entropy for uniform output; a conservative lower bound when categories are forced. */
  readonly entropyBits: number;
  readonly entropyIsLowerBound: boolean;
  /** Character-pool size (passwords/pins) or word-list size (passphrases). */
  readonly poolSize: number;
  /** Number of characters or words drawn. */
  readonly unitCount: number;
  readonly categories: ReadonlySet<CharCategory>;
  /** Stable, machine-readable notes (e.g. "forced_categories:lower,upper,digit"). */
  readonly notes: readonly string[];
}

export type StrengthLabel = "very-weak" | "weak" | "fair" | "strong" | "very-strong";

export interface CrackScenario {
  /** Stable key (e.g. "online_throttled"); the UI maps it to localized text. */
  readonly scenario: string;
  readonly guessesPerSec: number;
  /** Expected seconds to crack under this scenario. */
  readonly seconds: number;
}

export interface Strength {
  readonly bits: number;
  readonly label: StrengthLabel;
  readonly belowFloor: boolean;
  readonly crackTimes: readonly CrackScenario[];
}
