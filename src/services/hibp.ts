/**
 * Opt-in breach check via the Have-I-Been-Pwned "Pwned Passwords" range API,
 * using k-anonymity: we SHA-1 the password locally and send ONLY the first 5 hex
 * characters of the hash. The full password and full hash never leave the device.
 * This is the single external network call the whole app can make.
 */

const ENDPOINT = "https://api.pwnedpasswords.com/range/";

export interface BreachResult {
  readonly found: boolean;
  readonly count: number;
}

/** SHA-1 of the input as an uppercase hex string (via Web Crypto). */
export async function sha1HexUpper(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-1", data);
  let hex = "";
  for (const b of new Uint8Array(digest)) hex += b.toString(16).padStart(2, "0");
  return hex.toUpperCase();
}

/**
 * Check whether `password` appears in known breaches. Returns the breach count
 * (0 if not found). `fetchImpl` is injectable for testing; it defaults to the
 * platform fetch, bound to the global object.
 */
export async function checkPwned(password: string, fetchImpl?: typeof fetch): Promise<BreachResult> {
  const doFetch = fetchImpl ?? globalThis.fetch.bind(globalThis);

  const hash = await sha1HexUpper(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const res = await doFetch(ENDPOINT + prefix, {
    method: "GET",
    headers: { "Add-Padding": "true" }, // pad the response to thwart size-based analysis
    referrerPolicy: "no-referrer",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HIBP request failed with status ${res.status}`);

  const text = await res.text();
  for (const line of text.split(/\r?\n/)) {
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    if (line.slice(0, sep).trim().toUpperCase() === suffix) {
      const count = Number.parseInt(line.slice(sep + 1).trim(), 10);
      return { found: true, count: Number.isFinite(count) ? count : 0 };
    }
  }
  return { found: false, count: 0 };
}
