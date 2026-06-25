import { describe, it, expect } from "vitest";
import { PRESETS, applyPreset, validateAgainstPreset, getPreset } from "../src/core/presets";

describe("presets", () => {
  for (const p of PRESETS) {
    it(`${p.id}: many outputs satisfy validateAgainstPreset`, async () => {
      for (let i = 0; i < 150; i++) {
        const r = await applyPreset(p, { accountName: "ramin" });
        const v = validateAgainstPreset(p, r.secret, "ramin");
        expect(v.failures).toEqual([]);
        expect(r.secret.length).toBeGreaterThan(0);
      }
    });
  }

  it("windows-ad always has >= 3 categories and no ambiguous characters", async () => {
    const p = getPreset("windows-ad")!;
    for (let i = 0; i < 300; i++) {
      const r = await applyPreset(p);
      expect(r.categories.size).toBeGreaterThanOrEqual(3);
      expect(r.secret).not.toMatch(/[0O1lI|]/);
    }
  });

  it("wifi output stays within 8..63 printable ASCII", async () => {
    const p = getPreset("wifi")!;
    for (let i = 0; i < 100; i++) {
      const r = await applyPreset(p, { length: 63 });
      expect(r.secret.length).toBeGreaterThanOrEqual(8);
      expect(r.secret.length).toBeLessThanOrEqual(63);
      expect(r.secret).toMatch(/^[\x20-\x7e]+$/);
    }
  });

  it("macos-filevault never exceeds 32 ASCII characters", async () => {
    const p = getPreset("macos-filevault")!;
    for (let i = 0; i < 100; i++) {
      const r = await applyPreset(p);
      expect(r.secret.length).toBeLessThanOrEqual(32);
      expect(r.secret).toMatch(/^[\x20-\x7e]+$/);
    }
  });

  it("forbidAccountName keeps the account name out of windows-ad output", async () => {
    const p = getPreset("windows-ad")!;
    for (let i = 0; i < 50; i++) {
      const r = await applyPreset(p, { accountName: "ramin" });
      expect(r.secret.toLowerCase()).not.toContain("ramin");
    }
  });

  it("passphrase-windows meets >= 3 character classes", async () => {
    const p = getPreset("passphrase-windows")!;
    for (let i = 0; i < 100; i++) {
      const r = await applyPreset(p);
      expect(r.categories.size).toBeGreaterThanOrEqual(3);
    }
  });

  it("honors symbols + customExclude overrides while keeping windows-ad >= 3 classes", async () => {
    const p = getPreset("windows-ad")!;
    for (let i = 0; i < 100; i++) {
      const r = await applyPreset(p, { symbols: "none" });
      expect(r.categories.size).toBeGreaterThanOrEqual(3);
      expect(r.secret).toMatch(/^[A-Za-z0-9]+$/); // no symbols when overridden to "none"
    }
    const excluded = await applyPreset(p, { customExclude: "ABCDEF" });
    expect(excluded.secret).not.toMatch(/[ABCDEF]/);
  });

  it("every preset has bilingual labels, notes and warnings", () => {
    for (const p of PRESETS) {
      expect(p.labels.de.length).toBeGreaterThan(0);
      expect(p.labels.en.length).toBeGreaterThan(0);
      expect(Array.isArray(p.notes.de)).toBe(true);
      expect(Array.isArray(p.notes.en)).toBe(true);
      expect(Array.isArray(p.warnings.de)).toBe(true);
      expect(Array.isArray(p.warnings.en)).toBe(true);
    }
  });
});
