import type { CharCategory, GenResult, Lang, OutputType } from "./types";
import type { CharsetOptions } from "./charset";
import { detectCategories } from "./charset";
import { generatePassword, generatePin } from "./generator";
import { generatePassphrase } from "./passphrase";
import { loadWordList } from "./wordlists";

export interface RangeSpec {
  readonly min: number;
  readonly max: number;
  readonly default: number;
  readonly step?: number;
}

export interface PresetSpec {
  readonly id: string;
  readonly type: OutputType;
  readonly group: "passphrase" | "os" | "network" | "web" | "numeric" | "custom";
  readonly labels: Record<Lang, string>;
  readonly descriptions: Record<Lang, string>;

  /** For password/pin presets. */
  readonly length?: RangeSpec;
  /** For passphrase presets. */
  readonly words?: RangeSpec;

  // Password options
  readonly charset?: CharsetOptions;
  readonly requireCategories?: readonly CharCategory[];
  readonly minCategoryCount?: number;
  readonly maxLength?: number;
  readonly asciiOnly?: boolean;
  readonly forbidAccountName?: boolean;

  // Passphrase options
  readonly wordListLang?: Lang;
  readonly passphrase?: {
    readonly capitalize?: boolean;
    readonly separator?: string;
    readonly digit?: boolean;
    readonly symbol?: boolean;
    readonly symbolSet?: string;
  };

  readonly postProcess?: (s: string) => string;
  readonly notes: Record<Lang, readonly string[]>;
  readonly warnings: Record<Lang, readonly string[]>;
  readonly features?: { readonly wifiQr?: boolean };
}

export interface PresetParams {
  readonly length?: number;
  readonly words?: number;
  /** Used by presets with `forbidAccountName` to reject outputs containing it. */
  readonly accountName?: string;
  /** Optional override of the preset's ambiguous-character exclusion. */
  readonly excludeAmbiguous?: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function containsCI(haystack: string, needle: string): boolean {
  return needle.length >= 3 && haystack.toLowerCase().includes(needle.toLowerCase());
}

function withSecret(res: GenResult, secret: string): GenResult {
  if (secret === res.secret) return res;
  return {
    ...res,
    secret,
    categories: detectCategories(secret),
    unitCount: res.type === "passphrase" ? res.unitCount : secret.length,
  };
}

/** Generate a result for a preset, applying user overrides and compliance guarantees. */
export async function applyPreset(p: PresetSpec, overrides: PresetParams = {}): Promise<GenResult> {
  if (p.type === "passphrase") {
    const range = p.words ?? { min: 1, max: 64, default: 6 };
    const words = clamp(overrides.words ?? range.default, range.min, range.max);
    const wl = await loadWordList(p.wordListLang ?? "en");
    const res = generatePassphrase({
      wordList: wl.words,
      words,
      separator: p.passphrase?.separator ?? "-",
      decoration: {
        capitalize: p.passphrase?.capitalize ?? false,
        digit: p.passphrase?.digit ?? false,
        symbol: p.passphrase?.symbol ?? false,
        ...(p.passphrase?.symbolSet !== undefined ? { symbolSet: p.passphrase.symbolSet } : {}),
      },
    });
    return p.postProcess ? withSecret(res, p.postProcess(res.secret)) : res;
  }

  const range = p.length ?? { min: 4, max: 128, default: 16 };
  const length = clamp(overrides.length ?? range.default, range.min, range.max);

  if (p.type === "pin") return generatePin(length);

  // password — re-roll if the account name slips in
  const charset = {
    ...(p.charset ?? {}),
    ...(overrides.excludeAmbiguous !== undefined ? { excludeAmbiguous: overrides.excludeAmbiguous } : {}),
  };
  for (let attempt = 0; attempt < 1000; attempt++) {
    const raw = generatePassword({
      length,
      ...charset,
      ...(p.requireCategories !== undefined ? { requireCategories: p.requireCategories } : {}),
    });
    const res = p.postProcess ? withSecret(raw, p.postProcess(raw.secret)) : raw;
    if (p.forbidAccountName && overrides.accountName && containsCI(res.secret, overrides.accountName)) {
      continue;
    }
    return res;
  }
  throw new Error("applyPreset: could not satisfy constraints after 1000 attempts");
}

/** Check that a secret satisfies a preset's hard rules (used in tests and the UI). */
export function validateAgainstPreset(
  p: PresetSpec,
  secret: string,
  accountName?: string,
): { ok: boolean; failures: string[] } {
  const failures: string[] = [];

  if (p.type !== "passphrase" && p.length) {
    if (secret.length < p.length.min) failures.push(`length<${p.length.min}`);
    if (secret.length > p.length.max) failures.push(`length>${p.length.max}`);
  }
  if (p.maxLength !== undefined && secret.length > p.maxLength) failures.push(`length>${p.maxLength}`);
  if (p.asciiOnly && /[^\x20-\x7e]/.test(secret)) failures.push("non-ascii");

  if (p.minCategoryCount !== undefined) {
    const cats = detectCategories(secret);
    if (cats.size < p.minCategoryCount) failures.push(`categories<${p.minCategoryCount}`);
  }
  if (p.requireCategories) {
    const cats = detectCategories(secret);
    for (const c of p.requireCategories) if (!cats.has(c)) failures.push(`missing:${c}`);
  }
  if (p.type === "pin" && !/^[0-9]+$/.test(secret)) failures.push("pin-non-digit");

  if (p.features?.wifiQr) {
    if (secret.length < 8 || secret.length > 63) failures.push("wifi-length");
    if (/\s$/.test(secret)) failures.push("wifi-trailing-space");
  }
  if (p.forbidAccountName && accountName && containsCI(secret, accountName)) {
    failures.push("contains-account-name");
  }
  return { ok: failures.length === 0, failures };
}

const stripTrailingSpace = (s: string): string => s.replace(/\s+$/, "");

export const PRESETS: readonly PresetSpec[] = [
  {
    id: "passphrase-de",
    type: "passphrase",
    group: "passphrase",
    labels: { de: "Passphrase (Deutsch)", en: "Passphrase (German)" },
    descriptions: {
      de: "Merkbare Passphrase aus deutschen Wörtern (dys2p, umlautfrei).",
      en: "Memorable passphrase from German words (dys2p, no umlauts).",
    },
    words: { min: 4, max: 12, default: 6 },
    wordListLang: "de",
    passphrase: { separator: "-", capitalize: false },
    notes: {
      de: ["6 Wörter ≈ 78 Bit, 8 ≈ 103 Bit, 10 ≈ 129 Bit.", "Wörter durch „-“ getrennt."],
      en: ["6 words ≈ 78 bits, 8 ≈ 103 bits, 10 ≈ 129 bits.", "Words joined with “-”."],
    },
    warnings: { de: [], en: [] },
  },
  {
    id: "passphrase-en",
    type: "passphrase",
    group: "passphrase",
    labels: { de: "Passphrase (Englisch)", en: "Passphrase (English)" },
    descriptions: {
      de: "Merkbare Passphrase aus englischen Wörtern (EFF-Liste).",
      en: "Memorable passphrase from English words (EFF wordlist).",
    },
    words: { min: 4, max: 12, default: 6 },
    wordListLang: "en",
    passphrase: { separator: "-", capitalize: false },
    notes: {
      de: ["6 Wörter ≈ 78 Bit, 8 ≈ 103 Bit, 10 ≈ 129 Bit."],
      en: ["6 words ≈ 78 bits, 8 ≈ 103 bits, 10 ≈ 129 bits."],
    },
    warnings: { de: [], en: [] },
  },
  {
    id: "passphrase-windows",
    type: "passphrase",
    group: "passphrase",
    labels: { de: "Passphrase + Komplexität (Windows)", en: "Passphrase + complexity (Windows)" },
    descriptions: {
      de: "Merkbare deutsche Passphrase, die Windows-Komplexität erfüllt (Groß, Ziffer, Symbol).",
      en: "Memorable German passphrase that meets Windows complexity (caps, digit, symbol).",
    },
    words: { min: 4, max: 10, default: 6 },
    wordListLang: "de",
    passphrase: { separator: "-", capitalize: true, digit: true, symbol: true, symbolSet: "!#$*+-=?_" },
    minCategoryCount: 3,
    notes: {
      de: ["Jedes Wort groß + eine zufällige Ziffer und ein Symbol → ≥ 3 Zeichenklassen."],
      en: ["Each word capitalized + a random digit and symbol → ≥ 3 character classes."],
    },
    warnings: {
      de: ["Darf den Benutzernamen nicht enthalten — bitte selbst prüfen."],
      en: ["Must not contain your username — please check yourself."],
    },
  },
  {
    id: "windows-ad",
    type: "password",
    group: "os",
    labels: { de: "Windows / Active Directory", en: "Windows / Active Directory" },
    descriptions: {
      de: "Erfüllt die AD-Komplexität (≥ 3 von 5 Zeichenklassen), shell-sichere Symbole.",
      en: "Meets AD complexity (≥ 3 of 5 character classes), shell-safe symbols.",
    },
    length: { min: 8, max: 64, default: 16 },
    charset: { lower: true, upper: true, digit: true, symbols: "shellsafe", excludeAmbiguous: true },
    requireCategories: ["lower", "upper", "digit"],
    minCategoryCount: 3,
    asciiOnly: true,
    forbidAccountName: true,
    notes: {
      de: [
        "AD zählt 5 Klassen: Groß, Klein, Ziffer, Sonderzeichen, sonstige Unicode.",
        "Microsoft-Basis: min. 8; moderne Empfehlung ≥ 14.",
      ],
      en: [
        "AD counts 5 classes: upper, lower, digit, special, other-Unicode.",
        "Microsoft baseline: min 8; modern guidance ≥ 14.",
      ],
    },
    warnings: {
      de: ["Shell-sichere Symbole vermeiden ^ & | < > % und Leerzeichen."],
      en: ["Shell-safe symbols avoid ^ & | < > % and space."],
    },
  },
  {
    id: "macos-filevault",
    type: "password",
    group: "os",
    labels: { de: "macOS / FileVault", en: "macOS / FileVault" },
    descriptions: {
      de: "Sicher für den FileVault-Pre-Boot: ≤ 32 Zeichen, ASCII, konservative Symbole.",
      en: "Safe for the FileVault pre-boot screen: ≤ 32 chars, ASCII, conservative symbols.",
    },
    length: { min: 12, max: 32, default: 20 },
    maxLength: 32,
    charset: { lower: true, upper: true, digit: true, symbols: "macsafe", excludeAmbiguous: true },
    asciiOnly: true,
    notes: {
      de: ["Der Pre-Boot-Entsperrbildschirm verträgt sehr lange/exotische Passwörter schlecht."],
      en: ["The pre-boot unlock screen mishandles very long / exotic passwords."],
    },
    warnings: { de: [], en: [] },
  },
  {
    id: "macos-login",
    type: "password",
    group: "os",
    labels: { de: "macOS Login", en: "macOS Login" },
    descriptions: {
      de: "Reguläres macOS-Anmeldepasswort (permissiv), volle Symbole.",
      en: "Regular macOS login password (permissive), full symbols.",
    },
    length: { min: 12, max: 64, default: 20 },
    charset: { lower: true, upper: true, digit: true, symbols: "full" },
    asciiOnly: true,
    notes: { de: [], en: [] },
    warnings: { de: [], en: [] },
  },
  {
    id: "wifi",
    type: "password",
    group: "network",
    labels: { de: "WLAN (WPA2/WPA3)", en: "Wi-Fi (WPA2/WPA3)" },
    descriptions: {
      de: "8–63 druckbare ASCII-Zeichen; per QR-Code teilbar.",
      en: "8–63 printable ASCII characters; shareable via QR code.",
    },
    length: { min: 8, max: 63, default: 20 },
    charset: { lower: true, upper: true, digit: true, symbols: "websafe", excludeAmbiguous: true },
    asciiOnly: true,
    postProcess: stripTrailingSpace,
    features: { wifiQr: true },
    notes: {
      de: ["WPA-PSK erlaubt 8–63 druckbare ASCII-Zeichen.", "QR-Code: ohne Tippen verbinden."],
      en: ["WPA-PSK allows 8–63 printable ASCII characters.", "QR code: join without typing."],
    },
    warnings: {
      de: ["Manche Geräte haben Probleme mit Leerzeichen/Anführungszeichen — hier vermieden."],
      en: ["Some devices mishandle spaces/quotes — avoided here."],
    },
  },
  {
    id: "web",
    type: "password",
    group: "web",
    labels: { de: "Web-Konto (allgemein)", en: "Web account (general)" },
    descriptions: {
      de: "Robustes Web-Passwort mit URL-/Shell-sicheren Symbolen.",
      en: "Robust web password with URL/shell-safe symbols.",
    },
    length: { min: 12, max: 64, default: 20 },
    charset: { lower: true, upper: true, digit: true, symbols: "websafe", excludeAmbiguous: true },
    asciiOnly: true,
    notes: {
      de: ["Web-sichere Symbole überstehen URLs, Shells und CSV."],
      en: ["Web-safe symbols survive URLs, shells and CSV."],
    },
    warnings: {
      de: ["Manche Seiten kürzen still — bei Problemen Länge reduzieren."],
      en: ["Some sites silently truncate — reduce length if you hit issues."],
    },
  },
  {
    id: "pin",
    type: "pin",
    group: "numeric",
    labels: { de: "PIN (nur Ziffern)", en: "PIN (digits only)" },
    descriptions: {
      de: "Gleichverteilte Ziffern.",
      en: "Uniformly random digits.",
    },
    length: { min: 4, max: 12, default: 6 },
    notes: {
      de: ["4 Ziffern ≈ 13 Bit, 6 ≈ 20 Bit, 8 ≈ 27 Bit."],
      en: ["4 digits ≈ 13 bits, 6 ≈ 20 bits, 8 ≈ 27 bits."],
    },
    warnings: {
      de: ["PINs sind nur mit Geräte-Sperre/Rate-Limit sicher."],
      en: ["PINs are only safe with device lockout / rate limiting."],
    },
  },
  {
    id: "max-security",
    type: "password",
    group: "web",
    labels: { de: "Maximale Sicherheit", en: "Maximum security" },
    descriptions: {
      de: "Sehr langes Passwort, voller Zeichensatz.",
      en: "Very long password, full character set.",
    },
    length: { min: 16, max: 128, default: 32 },
    charset: { lower: true, upper: true, digit: true, symbols: "full" },
    asciiOnly: true,
    notes: {
      de: ["32 Zeichen ≈ 209 Bit."],
      en: ["32 characters ≈ 209 bits."],
    },
    warnings: { de: [], en: [] },
  },
  {
    id: "custom",
    type: "password",
    group: "custom",
    labels: { de: "Benutzerdefiniert", en: "Custom" },
    descriptions: {
      de: "Alle Regler frei einstellbar.",
      en: "All controls unlocked.",
    },
    length: { min: 4, max: 128, default: 20 },
    charset: { lower: true, upper: true, digit: true, symbols: "full" },
    asciiOnly: false,
    notes: { de: [], en: [] },
    warnings: { de: [], en: [] },
  },
];

export function getPreset(id: string): PresetSpec | undefined {
  return PRESETS.find((p) => p.id === id);
}

export const DEFAULT_PRESET_ID = "passphrase-de";
