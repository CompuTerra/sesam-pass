import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { copyWithAutoClear, type ClipboardWriter } from "../src/services/clipboard";

function recordingWriter(): { writer: ClipboardWriter; writes: string[] } {
  const writes: string[] = [];
  return { writer: { write: async (t: string) => void writes.push(t) }, writes };
}

describe("copyWithAutoClear", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("copies immediately and overwrites after the timeout", async () => {
    const { writer, writes } = recordingWriter();
    const onClear = vi.fn();
    await copyWithAutoClear("s3cret", { timeoutMs: 20000, writer, onClear });
    expect(writes).toEqual(["s3cret"]);

    await vi.advanceTimersByTimeAsync(20000);
    expect(writes.at(-1)).toBe(""); // secret overwritten
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("cancel() prevents the auto-clear", async () => {
    const { writer, writes } = recordingWriter();
    const onClear = vi.fn();
    const handle = await copyWithAutoClear("s3cret", { timeoutMs: 20000, writer, onClear });
    handle.cancel();

    await vi.advanceTimersByTimeAsync(20000);
    expect(writes).toEqual(["s3cret"]); // no overwrite write happened
    expect(onClear).not.toHaveBeenCalled();
  });
});
