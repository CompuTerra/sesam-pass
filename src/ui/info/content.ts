import type { Lang } from "../../core/types";

export interface InfoLink {
  readonly label: string;
  readonly href: string;
}

export interface InfoSection {
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly bullets?: readonly string[];
  readonly links?: readonly InfoLink[];
}

const DE: readonly InfoSection[] = [
  {
    title: "Wie sicher ist mein Ergebnis?",
    paragraphs: [
      "Sicherheit misst man in „Entropie“ (Bit). Jedes zusätzliche Bit verdoppelt den Aufwand zum Erraten. Die Zahl gibt an, wie viele gleich wahrscheinliche Möglichkeiten es gibt: bei n Bit sind es 2ⁿ.",
      "Faustregeln: unter ~50 Bit ist zu schwach, ~70–80 Bit sind solide, ab 100 Bit hoch und ab 128 Bit langfristig „paranoid“ sicher.",
      "Die zwei angezeigten Knackzeiten sind bewusst transparent: „Online (gedrosselt)“ nimmt 100 Versuche/Sekunde an (ein gut gesicherter Dienst), „Offline-GPU“ nimmt 100 Milliarden Versuche/Sekunde an (gestohlene Datenbank mit schwacher Hash-Funktion). Plane immer für den schlechteren Fall.",
      "Bei zufällig erzeugten Geheimnissen ist die Bit-Angabe exakt. Wo Zeichenklassen erzwungen werden (z. B. Windows), zeigen wir eine ehrliche Untergrenze („≥“).",
    ],
  },
  {
    title: "Warum Passphrasen?",
    paragraphs: [
      "Eine Passphrase besteht aus mehreren zufällig gewählten Wörtern (Diceware-Prinzip). Aus einer Liste mit 7776 Wörtern liefert jedes Wort rund 12,9 Bit Entropie.",
      "So sind 6 Wörter bereits ≈ 78 Bit, 8 Wörter ≈ 103 Bit, 10 Wörter ≈ 129 Bit — stark und trotzdem merk- und tippbar, ohne Sonderzeichen-Wirrwarr.",
      "Entscheidend: Die Zufälligkeit kommt vom Computer, nicht von dir. Selbst ausgedachte „zufällige“ Wörter sind viel schwächer. Verwendet werden die EFF-Liste (Englisch) und die dys2p-Liste (Deutsch, bewusst ohne Umlaute/ß).",
    ],
  },
  {
    title: "Wie wird erzeugt?",
    paragraphs: [
      "Alle Geheimnisse entstehen ausschließlich lokal in deinem Browser über die kryptografisch sichere Zufallsquelle der Web-Crypto-API (crypto.getRandomValues).",
      "Die Auswahl nutzt „Rejection-Sampling“, damit kein Zeichen bevorzugt wird (kein Modulo-Bias). Schwache Quellen wie Math.random werden bewusst nie verwendet.",
      "Es gibt kein Backend: Nichts wird an einen Server gesendet oder dort berechnet.",
    ],
  },
  {
    title: "Empfehlungen (NIST SP 800-63B)",
    paragraphs: ["Der aktuelle Standard betont Länge statt erzwungener Komplexität. Praktisch heißt das:"],
    bullets: [
      "Länge schlägt Komplexität — lange Passphrasen sind ausdrücklich gut.",
      "Pro Dienst ein eigenes, einzigartiges Passwort. Niemals wiederverwenden.",
      "Einen Passwortmanager nutzen — dann muss man sich nur wenige Geheimnisse merken.",
      "Wo möglich Zwei-Faktor-Authentisierung (2FA) aktivieren.",
      "Nicht ohne Anlass regelmäßig wechseln — nur bei Verdacht auf Kompromittierung.",
    ],
  },
  {
    title: "Der Leak-Check (Have I Been Pwned)",
    paragraphs: [
      "Der optionale Leak-Check prüft, ob ein Passwort in bekannten Datenlecks auftaucht — per „k-anonymity“: Es wird lokal ein SHA-1-Hash gebildet und nur dessen erste 5 Zeichen gesendet. Der Abgleich passiert wieder lokal.",
      "Das Passwort selbst verlässt also nie dein Gerät. Dies ist die einzige Netzwerkverbindung der App und passiert nur, wenn du sie anklickst.",
    ],
  },
  {
    title: "Sicherheit & Vertrauen",
    paragraphs: [
      "Bei jeder gehosteten Web-App vertraust du dem ausgelieferten Code. Wir minimieren dieses Restrisiko so weit wie möglich: kein Backend, kein Fremd-Code/keine Tracker, eine strenge Content-Security-Policy (nur der Leak-Check darf ins Netz), ein quelloffener, reproduzierbarer Build und volle Offline-Fähigkeit.",
      "Für maximale Sicherheit: die Seite installieren, das Netzwerk trennen und offline erzeugen. Schließe den Tab, wenn du fertig bist.",
      "Hinweis: Zwischenablage-Manager oder geräteübergreifende Zwischenablagen können kopierte Passwörter speichern.",
    ],
  },
  {
    title: "Die Umgebungs-Presets",
    paragraphs: ["Jedes Preset ist nur ein sicherer Startpunkt — alle Werte bleiben anpassbar:"],
    bullets: [
      "Windows / Active Directory: erfüllt die Komplexität (≥ 3 Zeichenklassen), shell-sichere Symbole, Kontoname wird ausgeschlossen.",
      "macOS / FileVault: ≤ 32 Zeichen, ASCII, konservative Symbole (Pre-Boot-Eigenheiten).",
      "WLAN (WPA2/WPA3): 8–63 druckbare ASCII-Zeichen, per QR-Code teilbar.",
      "Web-Konto: URL-/Shell-sichere Symbole, übersteht Kürzungen.",
      "PIN: nur Ziffern — nur mit Geräte-Sperre/Rate-Limit sinnvoll.",
      "Passphrasen / Maximale Sicherheit / Benutzerdefiniert für volle Kontrolle.",
    ],
  },
  {
    title: "Quellen & Weiterführendes",
    paragraphs: ["Zum Vertiefen:"],
    links: [
      { label: "EFF: Diceware-Wortlisten", href: "https://www.eff.org/dice" },
      { label: "dys2p: deutsche Wortlisten (wordlists-de)", href: "https://github.com/dys2p/wordlists-de" },
      { label: "Deutsche Diceware-Liste (bjoernalbers)", href: "https://github.com/bjoernalbers/diceware-wordlist-german" },
      { label: "NIST SP 800-63B (Digital Identity Guidelines)", href: "https://pages.nist.gov/800-63-4/sp800-63b.html" },
      { label: "Have I Been Pwned: Pwned Passwords", href: "https://haveibeenpwned.com/Passwords" },
    ],
  },
];

const EN: readonly InfoSection[] = [
  {
    title: "How strong is my result?",
    paragraphs: [
      "Strength is measured in “entropy” (bits). Each extra bit doubles the guessing effort. The number tells you how many equally likely possibilities exist: n bits means 2ⁿ.",
      "Rules of thumb: below ~50 bits is too weak, ~70–80 bits is solid, 100+ bits is high, and 128+ bits is “paranoid” / long-term safe.",
      "The two crack times are deliberately transparent: “Online (throttled)” assumes 100 guesses/second (a well-protected service), “Offline GPU” assumes 100 billion guesses/second (a stolen database with a weak hash). Always plan for the worse case.",
      "For randomly generated secrets the bit value is exact. Where character classes are forced (e.g. Windows), we show an honest lower bound (“≥”).",
    ],
  },
  {
    title: "Why passphrases?",
    paragraphs: [
      "A passphrase is several randomly chosen words (the diceware principle). From a 7776-word list, each word contributes about 12.9 bits of entropy.",
      "So 6 words is already ≈ 78 bits, 8 words ≈ 103 bits, 10 words ≈ 129 bits — strong yet memorable and typeable, without a tangle of special characters.",
      "Crucially, the randomness comes from the computer, not from you. Self-invented “random” words are far weaker. We use the EFF list (English) and the dys2p list (German, deliberately without umlauts/ß).",
    ],
  },
  {
    title: "How is it generated?",
    paragraphs: [
      "Every secret is produced entirely in your browser using the cryptographically secure randomness of the Web Crypto API (crypto.getRandomValues).",
      "Selection uses rejection sampling so no character is favored (no modulo bias). Weak sources like Math.random are intentionally never used.",
      "There is no backend: nothing is sent to or computed on a server.",
    ],
  },
  {
    title: "Recommendations (NIST SP 800-63B)",
    paragraphs: ["The current standard favors length over forced complexity. In practice:"],
    bullets: [
      "Length beats complexity — long passphrases are explicitly good.",
      "A unique password per service. Never reuse.",
      "Use a password manager — then you only memorize a few secrets.",
      "Enable two-factor authentication (2FA) where possible.",
      "Don’t rotate on a schedule for no reason — only on suspected compromise.",
    ],
  },
  {
    title: "The breach check (Have I Been Pwned)",
    paragraphs: [
      "The optional breach check tests whether a password appears in known data leaks — via “k-anonymity”: a SHA-1 hash is computed locally and only its first 5 characters are sent. The comparison happens locally again.",
      "So the password itself never leaves your device. This is the app’s only network connection, and only when you click it.",
    ],
  },
  {
    title: "Security & trust",
    paragraphs: [
      "With any hosted web app you trust the code it serves. We minimize that residual risk as much as possible: no backend, no third-party code/trackers, a strict Content Security Policy (only the breach check may reach the network), an open-source reproducible build, and full offline capability.",
      "For maximum assurance: install the page, disconnect the network, and generate offline. Close the tab when you’re done.",
      "Note: clipboard managers or cross-device clipboards may retain copied passwords.",
    ],
  },
  {
    title: "The environment presets",
    paragraphs: ["Each preset is just a safe starting point — every value stays adjustable:"],
    bullets: [
      "Windows / Active Directory: meets complexity (≥ 3 character classes), shell-safe symbols, excludes your account name.",
      "macOS / FileVault: ≤ 32 characters, ASCII, conservative symbols (pre-boot quirks).",
      "Wi-Fi (WPA2/WPA3): 8–63 printable ASCII characters, shareable via QR code.",
      "Web account: URL/shell-safe symbols, survives truncation.",
      "PIN: digits only — only safe with device lockout / rate limiting.",
      "Passphrases / Maximum security / Custom for full control.",
    ],
  },
  {
    title: "Sources & further reading",
    paragraphs: ["To dig deeper:"],
    links: [
      { label: "EFF: diceware wordlists", href: "https://www.eff.org/dice" },
      { label: "dys2p: German wordlists (wordlists-de)", href: "https://github.com/dys2p/wordlists-de" },
      { label: "German diceware list (bjoernalbers)", href: "https://github.com/bjoernalbers/diceware-wordlist-german" },
      { label: "NIST SP 800-63B (Digital Identity Guidelines)", href: "https://pages.nist.gov/800-63-4/sp800-63b.html" },
      { label: "Have I Been Pwned: Pwned Passwords", href: "https://haveibeenpwned.com/Passwords" },
    ],
  },
];

export function infoSections(lang: Lang): readonly InfoSection[] {
  return lang === "de" ? DE : EN;
}
