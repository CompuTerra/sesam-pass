import { describe, it, expect } from "vitest";
import { buildWifiPayload } from "../src/core/wifi";

describe("buildWifiPayload", () => {
  it("builds a basic WPA payload", () => {
    expect(buildWifiPayload({ ssid: "MyNet", password: "secret", auth: "WPA2" })).toBe(
      "WIFI:T:WPA;S:MyNet;P:secret;;",
    );
  });

  it("escapes \\ ; , : \" with the backslash escaped first", () => {
    const payload = buildWifiPayload({ ssid: "My;Net", password: 'a\\b;c,d:e"f', auth: "WPA" });
    expect(payload).toBe('WIFI:T:WPA;S:My\\;Net;P:a\\\\b\\;c\\,d\\:e\\"f;;');
  });

  it("omits the password for open networks", () => {
    expect(buildWifiPayload({ ssid: "Open", password: "ignored", auth: "nopass" })).toBe(
      "WIFI:T:nopass;S:Open;;",
    );
  });

  it("adds H:true for hidden networks and maps WPA3 to WPA", () => {
    expect(buildWifiPayload({ ssid: "H", password: "p", auth: "WPA3", hidden: true })).toBe(
      "WIFI:T:WPA;S:H;P:p;H:true;;",
    );
  });
});
