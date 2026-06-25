import type { Lang } from "../types";

export interface WordList {
  readonly id: string;
  readonly lang: Lang;
  readonly words: readonly string[];
  readonly bitsPerWord: number;
}

/**
 * Word lists are loaded via dynamic import so the bundler code-splits them into
 * separate chunks, fetched only when a passphrase is actually generated. They are
 * still part of the build (no runtime network fetch), so the app works offline.
 */
const LOADERS: Record<Lang, () => Promise<{ words: readonly string[] }>> = {
  de: () => import("./de_7776"),
  en: () => import("./eff_large"),
};

const ID: Record<Lang, string> = { de: "de_7776", en: "eff_large" };

const cache = new Map<Lang, WordList>();

export async function loadWordList(lang: Lang): Promise<WordList> {
  const cached = cache.get(lang);
  if (cached) return cached;
  const mod = await LOADERS[lang]();
  const wl: WordList = {
    id: ID[lang],
    lang,
    words: mod.words,
    bitsPerWord: Math.log2(mod.words.length),
  };
  cache.set(lang, wl);
  return wl;
}
