import type { CharCategory } from "./types";

/** Character classes. Symbols come in curated subsets for different environments. */
export const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digit: "0123456789",
  /** All printable ASCII punctuation (no space). */
  symbolFull: "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
  /** Survives URLs, shells, CSV and common truncation. */
  symbolWebSafe: "!#$%*+-=?@_~",
  /** Avoids shell-hostile chars (^ & | < > % and space). */
  symbolShellSafe: "!#$*+-=?@_.:,",
  /** Conservative set safe for the FileVault pre-boot screen. */
  symbolMacSafe: "!#$%*+-=?@_.",
} as const;

export type SymbolSet = "none" | "full" | "websafe" | "shellsafe" | "macsafe";

const SYMBOL_LOOKUP: Record<Exclude<SymbolSet, "none">, string> = {
  full: SETS.symbolFull,
  websafe: SETS.symbolWebSafe,
  shellsafe: SETS.symbolShellSafe,
  macsafe: SETS.symbolMacSafe,
};

/** Visually confusable characters, excluded by default in several presets. */
export const AMBIGUOUS_DEFAULT = "0O1lI|";

export interface CharsetOptions {
  lower?: boolean;
  upper?: boolean;
  digit?: boolean;
  symbols?: SymbolSet;
  excludeAmbiguous?: boolean;
  customExclude?: string;
}

export interface BuiltCharset {
  /** The full, de-duplicated, post-exclusion character pool. */
  readonly pool: string;
  /** Remaining characters per active category (after exclusions). */
  readonly byCategory: Partial<Record<CharCategory, string>>;
  readonly activeCategories: readonly CharCategory[];
}

function dedupe(s: string): string {
  const seen = new Set<string>();
  let out = "";
  for (const ch of s) {
    if (!seen.has(ch)) {
      seen.add(ch);
      out += ch;
    }
  }
  return out;
}

/** Build the concrete character pool from options, honoring all exclusions. */
export function buildCharset(o: CharsetOptions): BuiltCharset {
  const exclude = new Set<string>();
  if (o.excludeAmbiguous) for (const ch of AMBIGUOUS_DEFAULT) exclude.add(ch);
  if (o.customExclude) for (const ch of o.customExclude) exclude.add(ch);

  const clean = (s: string): string => dedupe([...s].filter((ch) => !exclude.has(ch)).join(""));

  const byCategory: Partial<Record<CharCategory, string>> = {};
  const active: CharCategory[] = [];
  const addCategory = (cat: CharCategory, base: string): void => {
    const cleaned = clean(base);
    if (cleaned.length > 0) {
      byCategory[cat] = cleaned;
      active.push(cat);
    }
  };

  if (o.lower) addCategory("lower", SETS.lower);
  if (o.upper) addCategory("upper", SETS.upper);
  if (o.digit) addCategory("digit", SETS.digit);
  if (o.symbols && o.symbols !== "none") addCategory("symbol", SYMBOL_LOOKUP[o.symbols]);

  const pool = dedupe(active.map((c) => byCategory[c]!).join(""));
  if (pool.length === 0) {
    throw new Error("buildCharset: empty character pool (no category enabled, or all excluded)");
  }
  return { pool, byCategory, activeCategories: active };
}

/** Classify which character categories are present in a string. */
export function detectCategories(secret: string): Set<CharCategory> {
  const cats = new Set<CharCategory>();
  for (const ch of secret) {
    if (SETS.lower.includes(ch)) cats.add("lower");
    else if (SETS.upper.includes(ch)) cats.add("upper");
    else if (SETS.digit.includes(ch)) cats.add("digit");
    else cats.add("symbol"); // any other printable character counts as a symbol
  }
  return cats;
}
