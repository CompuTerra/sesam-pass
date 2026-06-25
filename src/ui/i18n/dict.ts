import type { OutputType, StrengthLabel } from "../../core/types";
import type { SymbolSet } from "../../core/charset";

export type PresetGroup = "passphrase" | "os" | "network" | "web" | "numeric" | "custom";

/** All user-facing strings. `de` and `en` both implement this, so keys stay in sync. */
export interface Dict {
  appTitle: string;
  tagline: string;

  // sections
  sectionEnvironment: string;
  sectionOptions: string;
  sectionResult: string;

  // groups
  group: Record<PresetGroup, string>;

  // controls
  length: string;
  words: string;
  count: string;
  excludeAmbiguous: string;
  type: string;
  typeOption: Record<OutputType, string>;
  charLower: string;
  charUpper: string;
  charDigit: string;
  symbols: string;
  symbolOption: Record<SymbolSet, string>;
  customExclude: string;
  separator: string;
  separatorOption: Record<"dash" | "dot" | "underscore" | "space" | "none", string>;
  decDigits: string;
  decSymbols: string;
  capitalize: string;
  pronounceable: string;
  accountName: string;
  accountNamePlaceholder: string;
  advanced: string;

  // actions
  generate: string;
  regenerate: string;
  copy: string;
  copied: string;
  clipboardCleared: string;
  clickToCopy: string;
  show: string;
  hide: string;
  clearList: string;
  checkBreach: string;
  breachChecking: string;
  qr: string;

  // breach results
  breachFound: (count: number) => string;
  breachNotFound: string;
  breachError: string;
  breachDisclosure: string;

  // qr modal
  qrTitle: string;
  qrSsid: string;
  qrWarning: string;
  download: string;
  close: string;

  // strength
  entropy: string;
  bits: (n: number, lowerBound: boolean) => string;
  strengthLabel: Record<StrengthLabel, string>;
  belowFloor: string;
  crackTime: string;
  scenario: Record<string, string>;
  crackTimeValue: (seconds: number) => string;

  // chrome
  theme: string;
  themeOption: Record<"light" | "dark" | "auto", string>;
  language: string;
  navGenerator: string;
  navInfo: string;

  // trust / footer
  securityTitle: string;
  securityBody: string[];
  attribution: string;

  noResults: string;
}
