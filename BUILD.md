# Reproducible build & integrity verification

The whole app is static and has **zero runtime dependencies**, so a build is reproducible: the same
source + the same toolchain produce byte-identical output, and you can verify that what a host serves
matches what you build locally.

## Build

```bash
npm ci          # install the exact pinned toolchain (package-lock.json)
npm run build   # → dist/
```

Toolchain is pinned via `package-lock.json` and `.node-version` (Node 24). Vite emits only
content-hashed asset filenames (no timestamps), so two clean builds of the same commit match.

## What the build produces

- `dist/index.html` — references exactly one hashed JS module and one hashed CSS file, each carrying
  a Subresource-Integrity hash (`integrity="sha384-…"` + `crossorigin`). A strict CSP is embedded as
  a `<meta>` tag.
- `dist/assets/*` — the app chunk, the stylesheet, and the two word-list chunks (lazy-loaded).
- `dist/sw.js` — service worker that precaches every asset for offline use and never caches the HIBP
  API.
- `dist/_headers` — CSP + security headers for Cloudflare Pages / Netlify.
- `dist/SRI.txt` — the SRI hashes of the hashed assets.

## Verify a deployed site matches the source

1. `npm ci && npm run build` from the same commit.
2. Compare `dist/SRI.txt` (and the hashes inside `dist/index.html`) against the `integrity`
   attributes served by the host (View Source) — they must be identical.
3. Optionally diff the served `assets/*.js` against your local `dist/assets/*.js`.

If the hashes match, the host is serving exactly the audited source.

## Security checks the build/CI enforce

- `dependencies` in `package.json` is empty (no browser runtime dependencies).
- The source contains no `Math.random`, `eval`, or `innerHTML`.
- The CSP allows scripts/styles only from `'self'` and the single external origin
  `https://api.pwnedpasswords.com` (the opt-in breach check).
