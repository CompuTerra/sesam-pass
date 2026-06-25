export type WifiAuth = "WPA" | "WPA2" | "WPA3" | "WEP" | "nopass";

export interface WifiArgs {
  readonly ssid: string;
  readonly password: string;
  readonly auth: WifiAuth;
  readonly hidden?: boolean;
}

/**
 * Escape a value for the Wi-Fi QR payload. The special characters \ ; , : " must
 * be backslash-escaped, and the BACKSLASH must be escaped FIRST so we don't
 * double-escape the backslashes we add for the others.
 */
function escapeField(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/:/g, "\\:")
    .replace(/"/g, '\\"');
}

/**
 * Build a Wi-Fi network QR payload, e.g. `WIFI:T:WPA;S:MyNet;P:secret;;`.
 * WPA2/WPA3 both map to the "WPA" type token understood by phone cameras.
 */
export function buildWifiPayload(a: WifiArgs): string {
  const type = a.auth === "nopass" ? "nopass" : a.auth === "WEP" ? "WEP" : "WPA";
  const parts = [`T:${type}`, `S:${escapeField(a.ssid)}`];
  if (a.auth !== "nopass") parts.push(`P:${escapeField(a.password)}`);
  if (a.hidden) parts.push("H:true");
  return `WIFI:${parts.join(";")};;`;
}
