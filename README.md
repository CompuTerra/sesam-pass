# sesam-pass

> „Sesam, öffne dich.“

Sicherer, **vollständig client-seitiger** Passwort- & Passphrasen-Generator als statische Web-App.
Alle Geheimnisse werden lokal im Browser erzeugt (Web-Crypto-CSPRNG) — **es gibt kein Backend**.

> Secure, fully client-side password & passphrase generator. All secrets are generated locally in
> the browser; there is no backend.

## Highlights

- **Umgebungs-Presets**: Windows/Active Directory (garantiert ≥ 3 Zeichenklassen), macOS/FileVault
  (≤ 32 ASCII), WLAN (8–63 + QR-Code), Web, PIN, „Maximale Sicherheit" und merkbare Passphrasen
  (Deutsch dys2p / Englisch EFF).
- **Sicherheit nach aktuellem Stand** (NIST SP 800-63B Rev. 4): Länge vor Komplexität, ehrliche
  Entropie-Anzeige (exakt bzw. konservative Untergrenze), CSPRNG mit Rejection-Sampling (kein
  Modulo-Bias), **keine** `Math.random`-Nutzung.
- **Komfort**: Zwischenablage mit Auto-Löschung, Stärke-/Knackzeit-Anzeige, Batch-Generierung,
  WLAN-QR-Code, optionaler aussprechbarer Modus, Hell/Dunkel-Theme, **DE/EN** umschaltbar.
- **Breach-Check (opt-in)**: prüft via Have I Been Pwned mit k-anonymity — es verlassen nur die
  ersten 5 Zeichen eines SHA-1-Hashes das Gerät, niemals das Passwort. Einzige Netzwerkverbindung.
- **PWA / offline**: installierbar und ohne Netz (air-gapped) nutzbar.
- **Null Laufzeit-Abhängigkeiten** im Browser, **strenge CSP**, **SRI**, reproduzierbarer Build.

## Entwicklung

```bash
npm install
npm run dev        # Vite-Devserver (CSP wird nur im Build angewandt)
npm test           # Vitest (Kern, Services, UI-Smoke-Test)
npm run typecheck  # strenger tsc-Check
npm run build      # Produktions-Build nach dist/ (inkl. Härtung)
npm run preview    # gebautes dist/ lokal servieren
```

Node ≥ 20 (CI/Hosting nutzt Node 24, siehe `.node-version`).

## Architektur

- `src/core/` — reine, DOM-freie Logik (RNG, Zeichensätze, Generator, Passphrase, Entropie,
  Presets, WLAN, Wortlisten). Wiederverwendbar für ein späteres CLI.
- `src/services/` — Browser-Dienste (HIBP-Breach-Check, Zwischenablage, Einstellungen).
- `src/ui/` — Vanilla-TypeScript-Oberfläche (kein Framework) + i18n (DE/EN).
- `vendor/qrcodegen.ts` — QR-Generator von Nayuki (MIT), als auditierte Einzeldatei eingebunden.
- `wordlists/` — Rohquellen; `scripts/build-wordlists.ts` erzeugt daraus validierte TS-Module.
- `scripts/postbuild.ts` — SRI, Service Worker und `_headers` nach dem Vite-Build.

## Deployment (Cloudflare Pages / Netlify)

Statischer Output, kein Server nötig.

- **Build-Befehl**: `npm run build`
- **Publish-Verzeichnis**: `dist`
- **Node-Version**: 24 (via `.node-version` / `netlify.toml`)

`dist/_headers` setzt CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy` u. a. — wird von beiden
Anbietern automatisch angewandt. Eigene Domain wird unterstützt.

**Maximale Sicherheit:** `dist/` herunterladen, die PWA installieren, offline gehen und dort
generieren. Reproduzierbarkeit und SRI-Prüfung: siehe [BUILD.md](./BUILD.md).

## Lizenzen / Attribution

- Wortlisten: **EFF Large Wordlist** (CC BY 3.0 US), **dys2p wordlists-de** (CC0/Unlicense/BSD-3).
- QR: **Nayuki QR-Code-generator** (MIT).
- Projektcode: MIT.
