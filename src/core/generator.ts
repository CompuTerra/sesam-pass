import type { CharCategory, GenResult } from "./types";
import { buildCharset, detectCategories, SETS, type CharsetOptions } from "./charset";
import { charsetEntropyBits, forcedCategoryBits } from "./entropy";
import { pick, sampleWithReplacement, shuffleInPlace } from "./rng";

export interface PasswordOptions extends CharsetOptions {
  length: number;
  /** Force at least one character from each of these categories (if active in the pool). */
  requireCategories?: readonly CharCategory[];
}

/** Generate a random-character password, guaranteeing any required categories. */
export function generatePassword(o: PasswordOptions): GenResult {
  const length = Math.floor(o.length);
  if (length <= 0) throw new RangeError("generatePassword: length must be >= 1");

  const { pool, byCategory, activeCategories } = buildCharset(o);

  const required = (o.requireCategories ?? []).filter((c) => activeCategories.includes(c));
  if (required.length > length) {
    throw new RangeError("generatePassword: more required categories than characters");
  }

  // 1) draw uniformly from the pool
  const chars = sampleWithReplacement([...pool], length);

  // 2) guarantee >=1 char from each required category at distinct random positions
  if (required.length > 0) {
    const positions = shuffleInPlace([...Array(length).keys()]).slice(0, required.length);
    required.forEach((cat, i) => {
      chars[positions[i]!] = pick([...byCategory[cat]!]);
    });
  }

  const secret = chars.join("");
  const entropyBits =
    required.length > 0
      ? forcedCategoryBits(length, pool.length, required.map((c) => byCategory[c]!.length))
      : charsetEntropyBits(pool.length, length);

  const notes: string[] = [];
  if (required.length > 0) notes.push(`forced_categories:${required.join(",")}`);

  return {
    secret,
    type: "password",
    entropyBits,
    entropyIsLowerBound: required.length > 0,
    poolSize: pool.length,
    unitCount: length,
    categories: detectCategories(secret),
    notes,
  };
}

/** Generate a uniformly random numeric PIN. */
export function generatePin(length: number): GenResult {
  const n = Math.floor(length);
  if (n <= 0) throw new RangeError("generatePin: length must be >= 1");
  const secret = sampleWithReplacement([...SETS.digit], n).join("");
  return {
    secret,
    type: "pin",
    entropyBits: charsetEntropyBits(10, n),
    entropyIsLowerBound: false,
    poolSize: 10,
    unitCount: n,
    categories: new Set<CharCategory>(["digit"]),
    notes: [],
  };
}
