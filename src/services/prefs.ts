/**
 * Tiny localStorage wrapper that ONLY ever stores a fixed allowlist of NON-secret
 * UI preferences. Generated secrets are never persisted anywhere.
 */

export type PrefKey = "theme" | "lang" | "lastPresetId" | "batchCount";

const ALLOWED: ReadonlySet<string> = new Set<PrefKey>([
  "theme",
  "lang",
  "lastPresetId",
  "batchCount",
]);

const NAMESPACE = "pwgen:";

function safeStorage(): Storage | undefined {
  try {
    const ls = globalThis.localStorage;
    const probe = NAMESPACE + "__probe__";
    ls.setItem(probe, "1");
    ls.removeItem(probe);
    return ls;
  } catch {
    return undefined; // private mode, disabled storage, or non-browser context
  }
}

export function getPref(key: PrefKey): string | undefined {
  if (!ALLOWED.has(key)) return undefined;
  return safeStorage()?.getItem(NAMESPACE + key) ?? undefined;
}

export function setPref(key: PrefKey, value: string): void {
  if (!ALLOWED.has(key)) throw new Error(`prefs: refusing to store non-allowlisted key "${key}"`);
  safeStorage()?.setItem(NAMESPACE + key, value);
}
