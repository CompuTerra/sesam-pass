// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from "vitest";
import { webcrypto } from "node:crypto";

beforeAll(() => {
  if (!globalThis.crypto) (globalThis as { crypto: Crypto }).crypto = webcrypto as unknown as Crypto;
  if (!globalThis.matchMedia) {
    (globalThis as unknown as { matchMedia: unknown }).matchMedia = () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    });
  }
  if (!globalThis.requestAnimationFrame) {
    (globalThis as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame = (cb: (t: number) => void) =>
      setTimeout(() => cb(0), 0);
  }
});

async function waitFor(fn: () => boolean, timeout = 2000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (fn()) return;
    await new Promise((r) => setTimeout(r, 10));
  }
}

describe("app smoke test", () => {
  it("mounts the UI and generates a passphrase by default", async () => {
    document.body.appendChild(Object.assign(document.createElement("div"), { id: "app" }));
    const { init } = await import("../src/ui/app");
    init();

    const app = document.getElementById("app")!;
    expect(app.querySelector(".header__title")).toBeTruthy();
    expect(app.querySelector(".panel")).toBeTruthy();

    await waitFor(() => app.querySelector(".results .secret") !== null);
    const secret = app.querySelector(".results .secret")?.textContent ?? "";
    expect(secret.length).toBeGreaterThan(0);

    // strength meter rendered with a bit count
    expect(app.querySelector(".meter__bits")?.textContent ?? "").toMatch(/\d/);
  });
});
