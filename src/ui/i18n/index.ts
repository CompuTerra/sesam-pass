import type { Lang } from "../../core/types";
import type { Dict } from "./dict";
import { de } from "./de";
import { en } from "./en";

export type { Dict } from "./dict";

const DICTS: Record<Lang, Dict> = { de, en };

export function dict(lang: Lang): Dict {
  return DICTS[lang];
}
