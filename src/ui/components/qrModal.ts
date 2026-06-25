import type { Dict } from "../i18n";
import { el, on, clear } from "../dom";
import { buildWifiPayload, type WifiAuth } from "../../core/wifi";
import { qrcodegen } from "../../../vendor/qrcodegen";

// Minimal typed view of the vendored (type-checked-exempt) QR library.
interface QrApi {
  QrCode: {
    encodeText(text: string, ecl: unknown): { size: number; getModule(x: number, y: number): boolean };
  };
  Ecc: { MEDIUM: unknown };
}
const QR = qrcodegen as unknown as QrApi;

function renderQr(payload: string): HTMLCanvasElement {
  const qr = QR.QrCode.encodeText(payload, QR.Ecc.MEDIUM);
  const border = 2;
  const scale = 6;
  const dim = (qr.size + border * 2) * scale;
  const canvas = el("canvas", { width: dim, height: dim, class: "qr__canvas" });
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, dim, dim);
    ctx.fillStyle = "#000000";
    for (let y = 0; y < qr.size; y++) {
      for (let x = 0; x < qr.size; x++) {
        if (qr.getModule(x, y)) ctx.fillRect((x + border) * scale, (y + border) * scale, scale, scale);
      }
    }
  }
  return canvas;
}

/** Open a modal that turns a Wi-Fi password into a scannable QR code. */
export function openQrModal(password: string, d: Dict): void {
  let auth: WifiAuth = "WPA";
  let ssid = "";

  const holder = el("div", { class: "qr__holder" });
  const rebuild = (): void => {
    clear(holder);
    holder.append(renderQr(buildWifiPayload({ ssid: ssid || " ", password, auth })));
  };

  const ssidInput = el("input", {
    type: "text",
    class: "field__input",
    placeholder: d.qrSsid,
    "aria-label": d.qrSsid,
  });
  on(ssidInput, "input", () => {
    ssid = ssidInput.value;
    rebuild();
  });

  const authSelect = el("select", { class: "field__input", "aria-label": "Auth" }, [
    el("option", { value: "WPA" }, ["WPA / WPA2 / WPA3"]),
    el("option", { value: "WEP" }, ["WEP"]),
    el("option", { value: "nopass" }, ["Open"]),
  ]);
  on(authSelect, "change", () => {
    auth = authSelect.value as WifiAuth;
    rebuild();
  });

  const downloadBtn = el("button", { class: "btn", type: "button" }, [d.download]);
  on(downloadBtn, "click", () => {
    const canvas = holder.querySelector("canvas");
    if (!canvas) return;
    // Use a Blob + object URL (not a data: URL) and attach the anchor to the DOM:
    // robust across browsers and CSP-friendly.
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = el("a", { href: url, download: "sesam-pass-wifi-qr.png" });
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  });

  const closeBtn = el("button", { class: "btn btn--ghost", type: "button" }, [d.close]);
  const overlay = el("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": d.qrTitle });
  const close = (): void => {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (ev: KeyboardEvent): void => {
    if (ev.key === "Escape") close();
  };
  on(closeBtn, "click", close);
  on(overlay, "click", (ev) => {
    if (ev.target === overlay) close();
  });
  document.addEventListener("keydown", onKey);

  overlay.append(
    el("div", { class: "modal__panel" }, [
      el("h2", { class: "modal__title" }, [d.qrTitle]),
      el("label", { class: "field" }, [el("span", { class: "field__label" }, [d.qrSsid]), ssidInput]),
      el("label", { class: "field" }, [el("span", { class: "field__label" }, ["Auth"]), authSelect]),
      holder,
      el("p", { class: "qr__warn", role: "alert" }, [d.qrWarning]),
      el("div", { class: "modal__actions" }, [downloadBtn, closeBtn]),
    ]),
  );
  document.body.append(overlay);
  rebuild();
  ssidInput.focus();
}
