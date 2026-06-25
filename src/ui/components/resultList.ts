import type { GenResult } from "../../core/types";
import type { Dict } from "../i18n";
import { el, on } from "../dom";

export interface ResultHandlers {
  onCopy: (text: string, button: HTMLButtonElement) => void;
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
  let revealed = false;
  const secretEl = el(
    "code",
    { class: "secret secret--hidden", tabindex: "0", role: "button", "aria-label": d.show },
    [maskOf(r.secret)],
  );
  const setReveal = (value: boolean): void => {
    revealed = value;
    secretEl.textContent = revealed ? r.secret : maskOf(r.secret);
    secretEl.classList.toggle("secret--hidden", !revealed);
    secretEl.setAttribute("aria-label", revealed ? d.hide : d.show);
  };
  on(secretEl, "click", () => setReveal(!revealed));
  on(secretEl, "keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      setReveal(!revealed);
    }
  });

  const status = el("p", { class: "row__status", role: "status" });

  const actions: HTMLElement[] = [
    actionButton(d.show, () => setReveal(!revealed)),
    actionButton(d.copy, (b) => h.onCopy(r.secret, b)),
    actionButton(d.regenerate, () => h.onRegenerate(index)),
    actionButton(d.checkBreach, () => h.onBreachCheck(r.secret, status), (b) => {
      b.classList.add("iconbtn--breach");
      b.title = d.breachDisclosure;
    }),
  ];
  if (h.onQr) {
    actions.push(actionButton(d.qr, () => h.onQr?.(r.secret)));
  }

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

function maskOf(secret: string): string {
  return "•".repeat(Math.min(secret.length, 40));
}
