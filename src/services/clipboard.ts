/**
 * Copy a secret to the clipboard and automatically overwrite it after a timeout,
 * so it doesn't linger. NOTE: clipboard managers / OS clipboard sync may still
 * retain a copy — the UI warns about this; click-to-reveal is the safer path.
 */

export interface ClipboardWriter {
  write(text: string): Promise<void>;
}

const navigatorWriter: ClipboardWriter = {
  async write(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
  },
};

export interface CopyHandle {
  /** Cancel the pending auto-clear (e.g. when a new value is copied). */
  cancel(): void;
}

export interface CopyOptions {
  /** Milliseconds before the clipboard is overwritten (default 20000). */
  timeoutMs?: number;
  /** Injectable writer (defaults to navigator.clipboard); used in tests. */
  writer?: ClipboardWriter;
  /** Called after the auto-clear fires. */
  onClear?: () => void;
}

export async function copyWithAutoClear(text: string, options: CopyOptions = {}): Promise<CopyHandle> {
  const timeoutMs = options.timeoutMs ?? 20000;
  const writer = options.writer ?? navigatorWriter;

  await writer.write(text);

  let handle: ReturnType<typeof setTimeout> | undefined = setTimeout(() => {
    // Overwrite the secret with an empty value; swallow errors (e.g. tab not focused).
    void writer.write("").catch(() => {});
    handle = undefined;
    options.onClear?.();
  }, timeoutMs);

  return {
    cancel(): void {
      if (handle !== undefined) {
        clearTimeout(handle);
        handle = undefined;
      }
    },
  };
}
