import type { Dict } from "./dict";
import { formatDuration, type DurationUnits } from "./duration";

const nf = new Intl.NumberFormat("de-DE");
const fmt = (n: number): string => nf.format(n);

const units: DurationUnits = {
  instant: "sofort",
  uncrackable: "praktisch unknackbar",
  sec: "Sekunden",
  min: "Minuten",
  hour: "Stunden",
  day: "Tage",
  year: "Jahre",
  thousandYears: "Tsd. Jahre",
  millionYears: "Mio. Jahre",
  billionYears: "Mrd. Jahre",
  trillionYears: "Bio. Jahre",
};

export const de: Dict = {
  appTitle: "sesam-pass",
  tagline: "Sichere Passwörter & Passphrasen — alles lokal im Browser, ohne Backend.",

  sectionEnvironment: "Umgebung",
  sectionOptions: "Optionen",
  sectionResult: "Ergebnis",

  group: {
    passphrase: "Passphrasen",
    os: "Betriebssysteme",
    network: "Netzwerk",
    web: "Web & Allgemein",
    numeric: "Numerisch",
    custom: "Benutzerdefiniert",
  },

  length: "Länge",
  words: "Wörter",
  count: "Anzahl",
  excludeAmbiguous: "Mehrdeutige Zeichen ausschließen (0 O 1 l I |)",
  type: "Typ",
  typeOption: { password: "Passwort", passphrase: "Passphrase", pin: "PIN" },
  charLower: "Kleinbuchstaben (a–z)",
  charUpper: "Großbuchstaben (A–Z)",
  charDigit: "Ziffern (0–9)",
  symbols: "Symbole",
  symbolOption: {
    none: "keine",
    full: "alle",
    websafe: "web-sicher",
    shellsafe: "shell-sicher",
    macsafe: "macOS-sicher",
  },
  customExclude: "Zeichen ausschließen",
  separator: "Trennzeichen",
  separatorOption: {
    dash: "Bindestrich ( - )",
    dot: "Punkt ( . )",
    underscore: "Unterstrich ( _ )",
    space: "Leerzeichen",
    none: "keins",
  },
  decDigits: "Ziffern einfügen",
  decSymbols: "Symbole einfügen",
  capitalize: "Wörter großschreiben",
  pronounceable: "Aussprechbar (schwächer)",
  accountName: "Kontoname (wird ausgeschlossen)",
  accountNamePlaceholder: "z. B. Benutzername",
  advanced: "Erweitert",

  generate: "Generieren",
  regenerate: "Neu",
  copy: "Kopieren",
  copied: "Kopiert!",
  clipboardCleared: "Zwischenablage automatisch gelöscht",
  clickToCopy: "Klick zum Kopieren",
  show: "Anzeigen",
  hide: "Verbergen",
  clearList: "Liste leeren",
  checkBreach: "Auf Leaks prüfen",
  breachChecking: "Prüfe …",
  qr: "QR-Code",

  breachFound: (count) => `In Leaks gefunden (${nf.format(count)}×) — nicht verwenden!`,
  breachNotFound: "Nicht in bekannten Leaks gefunden",
  breachError: "Prüfung fehlgeschlagen (offline?)",
  breachDisclosure:
    "Prüft via Have I Been Pwned. Es werden nur die ersten 5 Zeichen eines SHA-1-Hashes gesendet (k-anonymity) — niemals das Passwort selbst. Dies ist die einzige Netzwerkverbindung der App.",

  qrTitle: "WLAN-QR-Code",
  qrSsid: "WLAN-Name (SSID)",
  qrWarning: "Der QR-Code enthält das Passwort im Klartext. Nur mit vertrauenswürdigen Personen teilen.",
  download: "Herunterladen",
  close: "Schließen",

  entropy: "Entropie",
  bits: (n, lowerBound) => `${lowerBound ? "≥ " : ""}${fmt(Math.round(n))} Bit`,
  strengthLabel: {
    "very-weak": "sehr schwach",
    weak: "schwach",
    fair: "solide",
    strong: "stark",
    "very-strong": "sehr stark",
  },
  belowFloor: "Zu schwach — nicht verwenden.",
  crackTime: "Geschätzte Knackzeit",
  scenario: {
    online_throttled: "Online (gedrosselt, 100/s)",
    offline_gpu: "Offline-GPU (10¹¹/s)",
  },
  crackTimeValue: (seconds) => formatDuration(seconds, units, fmt),

  theme: "Design",
  themeOption: { light: "Hell", dark: "Dunkel", auto: "System" },
  language: "Sprache",
  navGenerator: "Generator",
  navInfo: "Info & Sicherheit",

  securityTitle: "Sicherheit & Vertrauen",
  securityBody: [
    "Alle Passwörter werden ausschließlich lokal in deinem Browser erzeugt (Web-Crypto-CSPRNG). Es gibt kein Backend.",
    "Die einzige mögliche Netzwerkverbindung ist der freiwillige Leak-Check, der nur einen kurzen Hash-Präfix sendet.",
    "Für maximale Sicherheit: Seite installieren, offline gehen und dort generieren. Tab nach Gebrauch schließen.",
    "Hinweis: Zwischenablage-Manager können kopierte Passwörter speichern.",
  ],
  attribution:
    "Wortlisten: EFF (CC BY 3.0 US) und dys2p wordlists-de (CC0). QR: Nayuki (MIT). Open Source, auditierbar.",

  noResults: "Noch kein Ergebnis — wähle eine Umgebung und klicke „Generieren“.",
};
