import { describe, it, expect, vi } from "vitest";
import { checkPwned, sha1HexUpper } from "../src/services/hibp";

// SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8  → prefix 5BAA6
const PW_HASH = "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8";
const PW_SUFFIX = PW_HASH.slice(5);

describe("hibp k-anonymity", () => {
  it("sha1HexUpper matches the known vector for 'password'", async () => {
    expect(await sha1HexUpper("password")).toBe(PW_HASH);
  });

  it("sends only the 5-char prefix and finds a pwned suffix", async () => {
    let calledUrl = "";
    let calledHeaders: Record<string, string> = {};
    const fakeFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calledUrl = String(url);
      calledHeaders = (init?.headers as Record<string, string>) ?? {};
      const body = `0018A45C4D1DEF81644B54AB7F969B88D65:3\r\n${PW_SUFFIX}:42`;
      return new Response(body, { status: 200 });
    }) as unknown as typeof fetch;

    const r = await checkPwned("password", fakeFetch);
    expect(r.found).toBe(true);
    expect(r.count).toBe(42);
    expect(calledUrl).toBe("https://api.pwnedpasswords.com/range/5BAA6");
    expect(calledUrl).not.toContain(PW_SUFFIX); // the suffix never leaves the device
    expect(calledHeaders["Add-Padding"]).toBe("true");
  });

  it("reports not-found when the suffix is absent", async () => {
    const fakeFetch = vi.fn(
      async () => new Response("DEADBEEFDEADBEEFDEADBEEFDEADBEEFDEA:1\r\n", { status: 200 }),
    ) as unknown as typeof fetch;
    const r = await checkPwned("a-unique-secret-that-is-not-leaked-xyz", fakeFetch);
    expect(r.found).toBe(false);
    expect(r.count).toBe(0);
  });

  it("throws on an HTTP error", async () => {
    const fakeFetch = vi.fn(async () => new Response("", { status: 503 })) as unknown as typeof fetch;
    await expect(checkPwned("x", fakeFetch)).rejects.toThrow();
  });
});
