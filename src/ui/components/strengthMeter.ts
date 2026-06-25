import type { GenResult, Strength } from "../../core/types";
import type { Dict } from "../i18n";
import { el } from "../dom";

/** Render the entropy/strength panel for a result. */
export function strengthMeter(result: GenResult, strength: Strength, d: Dict): HTMLElement {
  const pct = Math.max(3, Math.min(100, (strength.bits / 128) * 100));

  const head = el("div", { class: "meter__head" }, [
    el("span", { class: "meter__bits" }, [d.bits(result.entropyBits, result.entropyIsLowerBound)]),
    el("span", { class: `meter__label meter__label--${strength.label}` }, [d.strengthLabel[strength.label]]),
  ]);

  const fill = el("div", { class: `meter__fill meter__fill--${strength.label}` });
  // Set width via the CSSOM (not a style="" attribute) so the strict CSP allows it.
  fill.style.width = `${pct}%`;
  const bar = el("div", { class: "meter__track", role: "img", "aria-label": d.entropy }, [fill]);

  const crack = el(
    "ul",
    { class: "meter__crack" },
    strength.crackTimes.map((c) =>
      el("li", {}, [
        el("span", { class: "meter__scenario" }, [d.scenario[c.scenario] ?? c.scenario]),
        el("span", { class: "meter__time" }, [d.crackTimeValue(c.seconds)]),
      ]),
    ),
  );

  const children: HTMLElement[] = [
    head,
    bar,
    el("div", { class: "meter__crack-title" }, [d.crackTime]),
    crack,
  ];
  if (strength.belowFloor) {
    children.push(el("p", { class: "meter__warn", role: "alert" }, [d.belowFloor]));
  }
  return el("div", { class: "meter" }, children);
}
