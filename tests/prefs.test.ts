import { describe, it, expect } from "vitest";
import { getPref, setPref } from "../src/services/prefs";

describe("prefs allowlist", () => {
  it("refuses to store keys outside the allowlist", () => {
    expect(() => setPref("evil" as never, "x")).toThrow();
    expect(getPref("evil" as never)).toBeUndefined();
  });

  it("does not throw for allowlisted keys (no-op without storage)", () => {
    expect(() => setPref("theme", "dark")).not.toThrow();
  });
});
