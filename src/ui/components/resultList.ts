import type { GenResult } from "../../core/types";
import type { Dict } from "../i18n";
import { el, on } from "../dom";

export interface ResultHandlers {
  /** Copy `text`; `feedback` is invoked on success (and again when auto-cleared). */
  onCopy: (text: string, feedback: (state: "copied" | "cleared") => void) => void;
  onRegenerate: (index: number) => void;
  onBreachCheck: (text: string, statusEl: HTMLElement) => void;
  onQr?: (text: string) => void;
}

export function resultList(results: readonly GenResult[], d: Dict, h: ResultHandlers): HTMLElement {
  const list = el("ul", { class: "results", "aria-live": "polite" });
  results.forEach((r, index) => list.append(resultRow(r, index, d, h)));
  return list;
}

function resultRow(r: GenResult, index: number, d: Dict, h: ResultHandlers): HTMLElement {
  // Shown by default; clicking the secret copies it (clicking still copies the real
  // value even when masked via the toggle).
  let revealed = true;
  const secretEl = el(
    "code",
    { class: "secret", tabindex: "0", role: "button", "aria-label": d.clickToCopy, title: d.clickToCopy },
    [r.secret],
  );
  const renderSecret = (): void => {
    secretEl.textContent = revealed ? r.secret : maskOf(r.secret);
    secretEl.classList.toggle("secret--hidden", !revealed);
  };

  const copyBtn = actionButton(d.copy, () => doCopy());
  function doCopy(): void {
    h.onCopy(r.secret, (s) => flashButton(copyBtn, s === "copied" ? d.copied : d.clipboardCleared));
  }
  on(secretEl, "click", doCopy);
  on(secretEl, "keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      doCopy();
    }
  });

  const toggleBtn = actionButton(d.hide, (b) => {
    revealed = !revealed;
    renderSecret();
    b.textContent = revealed ? d.hide : d.show;
  });

  const status = el("p", { class: "row__status", role: "status" });

  const actions: HTMLElement[] = [
    toggleBtn,
    copyBtn,
    actionButton(d.regenerate, () => h.onRegenerate(index)),
    actionButton(d.checkBreach, () => h.onBreachCheck(r.secret, status), (b) => {
      b.classList.add("iconbtn--breach");
      b.title = d.breachDisclosure;
    }),
  ];
  if (h.onQr) actions.push(actionButton(d.qr, () => h.onQr?.(r.secret)));

  return el("li", { class: "row" }, [
    el("div", { class: "row__top" }, [
      el("div", { class: "row__secret" }, [secretEl]),
      el("div", { class: "row__actions" }, actions),
    ]),
    status,
  ]);
}

function actionButton(
  label: string,
  onClick: (b: HTMLButtonElement) => void,
  decorate?: (b: HTMLButtonElement) => void,
): HTMLButtonElement {
  const button = el("button", { class: "iconbtn", type: "button" }, [label]);
  decorate?.(button);
  on(button, "click", () => onClick(button));
  return button;
}

const originalLabels = new WeakMap<HTMLButtonElement, string>();
function flashButton(button: HTMLButtonElement, message: string): void {
  if (!originalLabels.has(button)) originalLabels.set(button, button.textContent ?? "");
  button.textContent = message;
  button.classList.add("iconbtn--flash");
  window.setTimeout(() => {
    button.textContent = originalLabels.get(button) ?? "";
    button.classList.remove("iconbtn--flash");
    originalLabels.delete(button);
  }, 1500);
}

function maskOf(secret: string): string {
  return "•".repeat(Math.min(secret.length, 40));
}
