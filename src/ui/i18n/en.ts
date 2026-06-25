import type { Dict } from "./dict";
import { formatDuration, type DurationUnits } from "./duration";

const nf = new Intl.NumberFormat("en-US");
const fmt = (n: number): string => nf.format(n);

const units: DurationUnits = {
  instant: "instantly",
  uncrackable: "effectively uncrackable",
  sec: "seconds",
  min: "minutes",
  hour: "hours",
  day: "days",
  year: "years",
  thousandYears: "thousand years",
  millionYears: "million years",
  billionYears: "billion years",
  trillionYears: "trillion years",
};

export const en: Dict = {
  appTitle: "sesam-pass",
  tagline: "Secure passwords & passphrases — generated entirely in your browser, no backend.",

  sectionEnvironment: "Environment",
  sectionOptions: "Options",
  sectionResult: "Results",

  group: {
    passphrase: "Passphrases",
    os: "Operating systems",
    network: "Network",
    web: "Web & general",
    numeric: "Numeric",
    custom: "Custom",
  },

  length: "Length",
  words: "Words",
  count: "Count",
  excludeAmbiguous: "Exclude ambiguous characters (0 O 1 l I |)",
  type: "Type",
  typeOption: { password: "Password", passphrase: "Passphrase", pin: "PIN" },
  charLower: "Lowercase (a–z)",
  charUpper: "Uppercase (A–Z)",
  charDigit: "Digits (0–9)",
  symbols: "Symbols",
  symbolOption: {
    none: "none",
    full: "all",
    websafe: "web-safe",
    shellsafe: "shell-safe",
    macsafe: "macOS-safe",
  },
  customExclude: "Exclude characters",
  separator: "Separator",
  separatorOption: {
    dash: "Hyphen ( - )",
    dot: "Dot ( . )",
    underscore: "Underscore ( _ )",
    space: "Space",
    none: "none",
  },
  decDigits: "Add digits",
  decSymbols: "Add symbols",
  capitalize: "Capitalize words",
  pronounceable: "Pronounceable (weaker)",
  accountName: "Account name (excluded)",
  accountNamePlaceholder: "e.g. username",
  advanced: "Advanced",

  generate: "Generate",
  regenerate: "New",
  copy: "Copy",
  copied: "Copied!",
  clipboardCleared: "Clipboard cleared automatically",
  clickToCopy: "Click to copy",
  show: "Show",
  hide: "Hide",
  clearList: "Clear list",
  checkBreach: "Check breaches",
  breachChecking: "Checking …",
  qr: "QR code",

  breachFound: (count) => `Found in breaches (${nf.format(count)}×) — do not use!`,
  breachNotFound: "Not found in known breaches",
  breachError: "Check failed (offline?)",
  breachDisclosure:
    "Checks via Have I Been Pwned. Only the first 5 characters of a SHA-1 hash are sent (k-anonymity) — never the password itself. This is the app's only network connection.",

  qrTitle: "Wi-Fi QR code",
  qrSsid: "Wi-Fi name (SSID)",
  qrWarning: "The QR code contains the password in plain text. Only share with people you trust.",
  download: "Download",
  close: "Close",

  entropy: "Entropy",
  bits: (n, lowerBound) => `${lowerBound ? "≥ " : ""}${fmt(Math.round(n))} bits`,
  strengthLabel: {
    "very-weak": "very weak",
    weak: "weak",
    fair: "fair",
    strong: "strong",
    "very-strong": "very strong",
  },
  belowFloor: "Too weak — do not use.",
  crackTime: "Estimated crack time",
  scenario: {
    online_throttled: "Online (throttled, 100/s)",
    offline_gpu: "Offline GPU (10¹¹/s)",
  },
  crackTimeValue: (seconds) => formatDuration(seconds, units, fmt),

  theme: "Theme",
  themeOption: { light: "Light", dark: "Dark", auto: "System" },
  language: "Language",
  navGenerator: "Generator",
  navInfo: "Info & security",

  securityTitle: "Security & trust",
  securityBody: [
    "Every password is generated entirely in your browser (Web Crypto CSPRNG). There is no backend.",
    "The only possible network call is the optional breach check, which sends just a short hash prefix.",
    "For maximum assurance: install the page, go offline, and generate there. Close the tab when done.",
    "Note: clipboard managers may retain copied passwords.",
  ],
  attribution:
    "Wordlists: EFF (CC BY 3.0 US) and dys2p wordlists-de (CC0). QR: Nayuki (MIT). Open source, auditable.",

  noResults: "No result yet — pick an environment and click “Generate”.",
};
