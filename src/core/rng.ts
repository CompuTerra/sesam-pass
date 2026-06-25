/**
 * Cryptographically secure randomness — the trust root of the whole tool.
 *
 * Everything that touches a secret draws from here. It uses the Web Crypto
 * CSPRNG (`crypto.getRandomValues`) and integer sampling via REJECTION SAMPLING
 * so there is no modulo bias. There is intentionally NO `Math.random` fallback:
 * if a secure RNG is unavailable we throw rather than silently weaken output.
 */

const MAX_U32 = 0x1_0000_0000; // 2^32

function getCrypto(): Crypto {
  const c = globalThis.crypto;
  if (!c || typeof c.getRandomValues !== "function") {
    throw new Error("Web Crypto API unavailable: a secure random source is required.");
  }
  return c;
}

/** `n` cryptographically secure random bytes. */
export function randomBytes(n: number): Uint8Array {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError("randomBytes: n must be a non-negative integer");
  }
  const out = new Uint8Array(n);
  const c = getCrypto();
  const CHUNK = 65536; // getRandomValues rejects requests larger than this
  for (let offset = 0; offset < n; offset += CHUNK) {
    c.getRandomValues(out.subarray(offset, Math.min(offset + CHUNK, n)));
  }
  return out;
}

/**
 * Uniform integer in [0, maxExclusive) with NO modulo bias.
 *
 * We draw a 32-bit value and reject any draw at or above the largest multiple of
 * `maxExclusive` that fits in 32 bits, then take the remainder.
 */
export function randomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError("randomInt: maxExclusive must be a positive integer");
  }
  if (maxExclusive > MAX_U32) {
    throw new RangeError("randomInt: maxExclusive must be <= 2^32");
  }
  if (maxExclusive === 1) return 0;

  const limit = Math.floor(MAX_U32 / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  const c = getCrypto();
  for (;;) {
    c.getRandomValues(buf);
    const x = buf[0]!;
    if (x < limit) return x % maxExclusive;
    // else: in the biased tail — draw again
  }
}

/** Uniform random element of a non-empty array. */
export function pick<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new RangeError("pick: empty array");
  return arr[randomInt(arr.length)]!;
}

/** In-place Fisher–Yates shuffle using the unbiased RNG. Returns the same array. */
export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

/** `k` independent uniform picks (with replacement). */
export function sampleWithReplacement<T>(arr: readonly T[], k: number): T[] {
  if (k < 0) throw new RangeError("sampleWithReplacement: k must be >= 0");
  const out: T[] = new Array<T>(k);
  for (let i = 0; i < k; i++) out[i] = pick(arr);
  return out;
}
