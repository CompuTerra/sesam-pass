import { defineConfig } from "vitest/config";
import type { PluginOption } from "vite";
import { CSP } from "./scripts/security-headers";

/**
 * Inject the strict CSP as a <meta> tag at BUILD time only.
 * In dev, Vite relies on inline scripts + HMR over a websocket, which a strict
 * CSP would block — so we apply it for production builds (and the host also sets
 * it as a real HTTP header via dist/_headers).
 */
function cspMetaPlugin(): PluginOption {
  return {
    name: "pwgen-csp-meta",
    apply: "build",
    transformIndexHtml() {
      return [
        {
          tag: "meta",
          attrs: { "http-equiv": "Content-Security-Policy", content: CSP },
          injectTo: "head-prepend",
        },
      ];
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [cspMetaPlugin()],
  build: {
    target: "es2022",
    assetsInlineLimit: 0, // no data: URIs — keep assets external for SRI + a clean CSP
    cssCodeSplit: false, // a single stylesheet
    modulePreload: { polyfill: false }, // avoid Vite's inline modulepreload polyfill (CSP)
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash][extname]",
      },
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
