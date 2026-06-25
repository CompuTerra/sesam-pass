import type { GenResult, Lang, OutputType } from "../core/types";
import type { SymbolSet } from "../core/charset";
import { PRESETS, getPreset, applyPreset, DEFAULT_PRESET_ID, type PresetSpec } from "../core/presets";
import { generatePassword, generatePin } from "../core/generator";
import { generatePassphrase } from "../core/passphrase";
import { generatePronounceable } from "../core/pronounceable";
import { loadWordList } from "../core/wordlists";
import { strengthFromBits } from "../core/entropy";
import { dict, type Dict } from "./i18n";
import type { PresetGroup } from "./i18n/dict";
import { el, clear, on, mountPoint } from "./dom";
import { strengthMeter } from "./components/strengthMeter";
import { resultList, type ResultHandlers } from "./components/resultList";
import { openQrModal } from "./components/qrModal";
import { checkPwned } from "../services/hibp";
import { copyWithAutoClear } from "../services/clipboard";
import { getPref, setPref } from "../services/prefs";

type Theme = "light" | "dark" | "auto";

interface State {
  lang: Lang;
  theme: Theme;
  presetId: string;
  type: OutputType;
  length: number;
  words: number;
  separator: string;
  capitalize: boolean;
  decDigitCount: number;
  decSymbolCount: number;
  decSymbolSet: string;
  lower: boolean;
  upper: boolean;
  digit: boolean;
  symbols: SymbolSet;
  excludeAmbiguous: boolean;
  customExclude: string;
  accountName: string;
  pronounceable: boolean;
  batchCount: number;
  results: GenResult[];
}

const state: State = {
  lang: "de",
  theme: "auto",
  presetId: DEFAULT_PRESET_ID,
  type: "passphrase",
  length: 20,
  words: 6,
  separator: "-",
  capitalize: false,
  decDigitCount: 0,
  decSymbolCount: 0,
  decSymbolSet: "",
  lower: true,
  upper: true,
  digit: true,
  symbols: "full",
  excludeAmbiguous: false,
  customExclude: "",
  accountName: "",
  pronounceable: false,
  batchCount: 1,
  results: [],
};

let root: HTMLElement;
let outputEl: HTMLElement | undefined;
let lastError: string | null = null;

// ---- helpers ----------------------------------------------------------------

function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.floor(v)));
}

function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function seedFromPreset(p: PresetSpec): void {
  state.type = p.type;
  if (p.length) state.length = p.length.default;
  if (p.words) state.words = p.words.default;
  const cs = p.charset;
  state.lower = cs?.lower ?? true;
  state.upper = cs?.upper ?? true;
  state.digit = cs?.digit ?? true;
  state.symbols = cs?.symbols ?? "full";
  state.excludeAmbiguous = cs?.excludeAmbiguous ?? false;
  state.customExclude = cs?.customExclude ?? "";
  state.separator = p.passphrase?.separator ?? "-";
  state.capitalize = p.passphrase?.capitalize ?? false;
  state.decDigitCount = p.passphrase?.digitCount ?? 0;
  state.decSymbolCount = p.passphrase?.symbolCount ?? 0;
  state.decSymbolSet = p.passphrase?.symbolSet ?? "";
  state.pronounceable = false;
}

async function generateOne(): Promise<GenResult> {
  const preset = getPreset(state.presetId)!;
  if (state.type === "passphrase") {
    const lang = state.presetId === "custom" ? state.lang : (preset.wordListLang ?? state.lang);
    const wl = await loadWordList(lang);
    return generatePassphrase({
      wordList: wl.words,
      words: state.words,
      separator: state.separator,
      decoration: {
        capitalize: state.capitalize,
        digitCount: state.decDigitCount,
        symbolCount: state.decSymbolCount,
        symbolSet: state.decSymbolSet,
      },
    });
  }
  if (state.type === "pin") return generatePin(state.length);
  if (state.presetId === "custom") {
    if (state.pronounceable) {
      return generatePronounceable({ syllables: Math.max(3, Math.round(state.length / 2)) });
    }
    return generatePassword({
      length: state.length,
      lower: state.lower,
      upper: state.upper,
      digit: state.digit,
      symbols: state.symbols,
      excludeAmbiguous: state.excludeAmbiguous,
      customExclude: state.customExclude,
    });
  }
  return applyPreset(preset, {
    length: state.length,
    accountName: state.accountName,
    excludeAmbiguous: state.excludeAmbiguous,
    symbols: state.symbols,
    customExclude: state.customExclude,
  });
}

async function regenerate(count: number): Promise<void> {
  const n = clampInt(count, 1, 50);
  try {
    const out: GenResult[] = [];
    for (let i = 0; i < n; i++) out.push(await generateOne());
    state.results = out;
    lastError = null;
  } catch (e) {
    state.results = [];
    lastError = errText(e);
  }
  updateOutput();
}

let regenScheduled = false;
function scheduleRegen(): void {
  if (regenScheduled) return;
  regenScheduled = true;
  requestAnimationFrame(() => {
    regenScheduled = false;
    void regenerate(state.batchCount);
  });
}

function applyTheme(): void {
  const dark = state.theme === "auto"
    ? matchMedia("(prefers-color-scheme: dark)").matches
    : state.theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

// ---- row handlers -----------------------------------------------------------

async function onCopy(text: string, feedback: (state: "copied" | "cleared") => void): Promise<void> {
  try {
    await copyWithAutoClear(text, { timeoutMs: 20000, onClear: () => feedback("cleared") });
    feedback("copied");
  } catch {
    /* clipboard unavailable (e.g. insecure context) — silently ignore */
  }
}

async function onRegenerate(index: number): Promise<void> {
  try {
    const fresh = await generateOne();
    state.results = state.results.map((r, i) => (i === index ? fresh : r));
    lastError = null;
  } catch (e) {
    lastError = errText(e);
  }
  updateOutput();
}

async function onBreachCheck(text: string, statusEl: HTMLElement): Promise<void> {
  const d = dict(state.lang);
  statusEl.textContent = d.breachChecking;
  statusEl.className = "row__status row__status--checking";
  try {
    const res = await checkPwned(text);
    if (res.found) {
      statusEl.textContent = d.breachFound(res.count);
      statusEl.className = "row__status row__status--bad";
    } else {
      statusEl.textContent = d.breachNotFound;
      statusEl.className = "row__status row__status--good";
    }
  } catch {
    statusEl.textContent = d.breachError;
    statusEl.className = "row__status row__status--warn";
  }
}

// ---- control builders -------------------------------------------------------

function sliderField(label: string, value: number, min: number, max: number, onInput: (v: number) => void): HTMLElement {
  const valueEl = el("span", { class: "slider__value" }, [String(value)]);
  const input = el("input", {
    type: "range",
    class: "slider",
    min: String(min),
    max: String(max),
    step: "1",
    value: String(value),
    "aria-label": label,
  });
  on(input, "input", () => {
    const v = Number(input.value);
    valueEl.textContent = String(v);
    onInput(v);
  });
  return el("label", { class: "field field--slider" }, [
    el("span", { class: "field__label" }, [`${label}: `, valueEl]),
    input,
  ]);
}

function checkboxField(label: string, checked: boolean, onChange: (v: boolean) => void): HTMLElement {
  const input = el("input", { type: "checkbox", class: "checkbox", checked });
  on(input, "change", () => onChange(input.checked));
  return el("label", { class: "field field--check" }, [input, el("span", {}, [label])]);
}

function selectField(
  label: string,
  value: string,
  options: ReadonlyArray<{ value: string; label: string }>,
  onChange: (v: string) => void,
): HTMLElement {
  const select = el(
    "select",
    { class: "field__input", "aria-label": label },
    options.map((o) => el("option", { value: o.value }, [o.label])),
  );
  select.value = value;
  on(select, "change", () => onChange(select.value));
  return el("label", { class: "field" }, [el("span", { class: "field__label" }, [label]), select]);
}

function textField(
  label: string,
  value: string,
  placeholder: string,
  onInput: (v: string) => void,
): HTMLElement {
  const input = el("input", { type: "text", class: "field__input", value, placeholder, "aria-label": label });
  on(input, "input", () => onInput(input.value));
  return el("label", { class: "field" }, [el("span", { class: "field__label" }, [label]), input]);
}

function symbolSetField(d: Dict): HTMLElement {
  return selectField(
    d.symbols,
    state.symbols,
    [
      { value: "none", label: d.symbolOption.none },
      { value: "full", label: d.symbolOption.full },
      { value: "websafe", label: d.symbolOption.websafe },
      { value: "shellsafe", label: d.symbolOption.shellsafe },
      { value: "macsafe", label: d.symbolOption.macsafe },
    ],
    (v) => {
      state.symbols = v as SymbolSet;
      scheduleRegen();
    },
  );
}

function buildOptions(d: Dict): HTMLElement {
  const preset = getPreset(state.presetId)!;
  const isCustom = state.presetId === "custom";
  const wrap = el("div", { class: "options" });

  if (isCustom) {
    wrap.append(
      selectField(
        d.type,
        state.type,
        [
          { value: "password", label: d.typeOption.password },
          { value: "passphrase", label: d.typeOption.passphrase },
          { value: "pin", label: d.typeOption.pin },
        ],
        (v) => {
          state.type = v as OutputType;
          render(); // type change alters which controls are shown
        },
      ),
    );
  }

  if (state.type === "passphrase") {
    const w = preset.words ?? { min: 3, max: 12, default: 6 };
    wrap.append(sliderField(d.words, state.words, w.min, w.max, (v) => { state.words = v; scheduleRegen(); }));
    wrap.append(
      selectField(d.separator, state.separator, [
        { value: "-", label: d.separatorOption.dash },
        { value: ".", label: d.separatorOption.dot },
        { value: "_", label: d.separatorOption.underscore },
        { value: " ", label: d.separatorOption.space },
        { value: "", label: d.separatorOption.none },
      ], (v) => { state.separator = v; scheduleRegen(); }),
    );
    wrap.append(checkboxField(d.capitalize, state.capitalize, (v) => { state.capitalize = v; scheduleRegen(); }));
    wrap.append(sliderField(d.decDigits, state.decDigitCount, 0, 3, (v) => { state.decDigitCount = v; scheduleRegen(); }));
    wrap.append(sliderField(d.decSymbols, state.decSymbolCount, 0, 3, (v) => { state.decSymbolCount = v; scheduleRegen(); }));
  } else if (state.type === "pin") {
    const r = preset.length ?? { min: 4, max: 12, default: 6 };
    wrap.append(sliderField(d.length, state.length, r.min, r.max, (v) => { state.length = v; scheduleRegen(); }));
  } else {
    const r = preset.length ?? { min: 4, max: 128, default: 20 };
    wrap.append(sliderField(d.length, state.length, r.min, r.max, (v) => { state.length = v; scheduleRegen(); }));
    if (isCustom) {
      wrap.append(checkboxField(d.charLower, state.lower, (v) => { state.lower = v; scheduleRegen(); }));
      wrap.append(checkboxField(d.charUpper, state.upper, (v) => { state.upper = v; scheduleRegen(); }));
      wrap.append(checkboxField(d.charDigit, state.digit, (v) => { state.digit = v; scheduleRegen(); }));
      wrap.append(symbolSetField(d));
      wrap.append(textField(d.customExclude, state.customExclude, "", (v) => { state.customExclude = v; scheduleRegen(); }));
      wrap.append(checkboxField(d.excludeAmbiguous, state.excludeAmbiguous, (v) => { state.excludeAmbiguous = v; scheduleRegen(); }));
      wrap.append(checkboxField(d.pronounceable, state.pronounceable, (v) => { state.pronounceable = v; scheduleRegen(); }));
    } else {
      wrap.append(
        el("details", { class: "advanced" }, [
          el("summary", { class: "advanced__summary" }, [d.advanced]),
          el("div", { class: "advanced__body" }, [
            symbolSetField(d),
            checkboxField(d.excludeAmbiguous, state.excludeAmbiguous, (v) => { state.excludeAmbiguous = v; scheduleRegen(); }),
            textField(d.customExclude, state.customExclude, "", (v) => { state.customExclude = v; scheduleRegen(); }),
          ]),
        ]),
      );
    }
    if (preset.forbidAccountName) {
      wrap.append(textField(d.accountName, state.accountName, d.accountNamePlaceholder, (v) => { state.accountName = v; scheduleRegen(); }));
    }
  }
  return wrap;
}

function buildActions(d: Dict): HTMLElement {
  const countInput = el("input", {
    type: "number",
    class: "count",
    min: "1",
    max: "50",
    value: String(state.batchCount),
    "aria-label": d.count,
  });
  on(countInput, "change", () => {
    state.batchCount = clampInt(Number(countInput.value), 1, 50);
    countInput.value = String(state.batchCount);
  });

  const generateBtn = el("button", { class: "btn btn--primary", type: "button" }, [d.generate]);
  on(generateBtn, "click", () => void regenerate(state.batchCount));

  const clearBtn = el("button", { class: "btn btn--ghost", type: "button" }, [d.clearList]);
  on(clearBtn, "click", () => {
    state.results = [];
    lastError = null;
    updateOutput();
  });

  return el("div", { class: "actions" }, [
    el("label", { class: "field field--count" }, [el("span", { class: "field__label" }, [d.count]), countInput]),
    generateBtn,
    clearBtn,
  ]);
}

function buildEnvironment(d: Dict): HTMLElement {
  const groupOrder: PresetGroup[] = ["passphrase", "os", "network", "web", "numeric", "custom"];
  const select = el("select", { class: "field__input field__input--preset", "aria-label": d.sectionEnvironment });
  for (const g of groupOrder) {
    const inGroup = PRESETS.filter((p) => p.group === g);
    if (inGroup.length === 0) continue;
    select.append(
      el(
        "optgroup",
        { label: d.group[g] },
        inGroup.map((p) => el("option", { value: p.id }, [p.labels[state.lang]])),
      ),
    );
  }
  select.value = state.presetId;
  on(select, "change", () => onPresetChange(select.value));

  const preset = getPreset(state.presetId)!;
  const info = el("div", { class: "preset-info" }, [
    el("p", { class: "preset-desc" }, [preset.descriptions[state.lang]]),
    ...preset.notes[state.lang].map((n) => el("p", { class: "preset-note" }, [n])),
    ...preset.warnings[state.lang].map((n) => el("p", { class: "preset-warn" }, [n])),
  ]);

  return el("section", { class: "panel" }, [
    el("h2", { class: "panel__title" }, [d.sectionEnvironment]),
    el("div", { class: "field" }, [select]),
    info,
  ]);
}

function onPresetChange(id: string): void {
  const p = getPreset(id);
  if (!p) return;
  state.presetId = id;
  seedFromPreset(p);
  setPref("lastPresetId", id);
  render();
  void regenerate(state.batchCount);
}

function navButton(label: string, active: boolean, onClick: () => void): HTMLElement {
  const button = el("button", { class: active ? "tab tab--active" : "tab", type: "button" }, [label]);
  if (active) button.setAttribute("aria-current", "page");
  on(button, "click", onClick);
  return button;
}

function buildHeader(d: Dict, route: Route): HTMLElement {
  const langSelect = selectField(
    d.language,
    state.lang,
    [
      { value: "de", label: "Deutsch" },
      { value: "en", label: "English" },
    ],
    (v) => {
      state.lang = v as Lang;
      setPref("lang", v);
      render();
    },
  );
  const themeSelect = selectField(
    d.theme,
    state.theme,
    [
      { value: "auto", label: d.themeOption.auto },
      { value: "light", label: d.themeOption.light },
      { value: "dark", label: d.themeOption.dark },
    ],
    (v) => {
      state.theme = v as Theme;
      setPref("theme", v);
      applyTheme();
    },
  );
  const nav = el("nav", { class: "nav" }, [
    navButton(d.navGenerator, route === "generator", () => go("generator")),
    navButton(d.navInfo, route === "info", () => go("info")),
  ]);
  return el("header", { class: "header" }, [
    el("div", { class: "header__brand" }, [
      el("h1", { class: "header__title" }, [d.appTitle]),
      el("p", { class: "header__tagline" }, [d.tagline]),
    ]),
    nav,
    el("div", { class: "header__controls" }, [langSelect, themeSelect]),
  ]);
}

function buildFooter(d: Dict): HTMLElement {
  return el("footer", { class: "footer" }, [
    el("h2", { class: "footer__title" }, [d.securityTitle]),
    ...d.securityBody.map((t) => el("p", { class: "footer__line" }, [t])),
    el("p", { class: "footer__attr" }, [d.attribution]),
  ]);
}

function buildOutput(d: Dict): HTMLElement {
  outputEl = el("div", { class: "output" });
  const panel = el("section", { class: "panel" }, [
    el("h2", { class: "panel__title" }, [d.sectionResult]),
    outputEl,
  ]);
  updateOutput();
  return panel;
}

function updateOutput(): void {
  if (!outputEl) return;
  const d = dict(state.lang);
  clear(outputEl);

  if (state.results.length === 0) {
    outputEl.append(el("p", { class: "empty" }, [lastError ?? d.noResults]));
    return;
  }

  const first = state.results[0]!;
  outputEl.append(strengthMeter(first, strengthFromBits(first.entropyBits), d));

  const preset = getPreset(state.presetId)!;
  const handlers: ResultHandlers = {
    onCopy: (t, fb) => void onCopy(t, fb),
    onRegenerate: (i) => void onRegenerate(i),
    onBreachCheck: (t, s) => void onBreachCheck(t, s),
    ...(preset.features?.wifiQr ? { onQr: (t: string) => openQrModal(t, dict(state.lang)) } : {}),
  };
  outputEl.append(resultList(state.results, d, handlers));
}

type Route = "generator" | "info";

function currentRoute(): Route {
  return location.hash.replace(/^#/, "") === "info" ? "info" : "generator";
}

function go(route: Route): void {
  if (route === "info") location.hash = "info";
  else if (location.hash) location.hash = "";
  else render();
}

function render(): void {
  const d = dict(state.lang);
  document.documentElement.lang = state.lang;
  const route = currentRoute();
  clear(root);

  if (route === "info") {
    outputEl = undefined;
    const main = el("main", { class: "main" });
    root.append(buildHeader(d, route), main, buildFooter(d));
    void import("./components/infoView").then(({ infoView }) => main.append(infoView(state.lang)));
    return;
  }

  root.append(
    buildHeader(d, route),
    el("main", { class: "main" }, [
      buildEnvironment(d),
      el("section", { class: "panel" }, [
        el("h2", { class: "panel__title" }, [d.sectionOptions]),
        buildOptions(d),
        buildActions(d),
      ]),
      buildOutput(d),
    ]),
    buildFooter(d),
  );
}

function detectLang(): Lang {
  return navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
}

export function init(): void {
  root = mountPoint("app");

  const savedLang = getPref("lang");
  state.lang = savedLang === "de" || savedLang === "en" ? savedLang : detectLang();
  const savedTheme = getPref("theme");
  state.theme = savedTheme === "light" || savedTheme === "dark" || savedTheme === "auto" ? savedTheme : "auto";
  const savedPreset = getPref("lastPresetId");
  if (savedPreset && getPreset(savedPreset)) state.presetId = savedPreset;

  seedFromPreset(getPreset(state.presetId)!);
  applyTheme();
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (state.theme === "auto") applyTheme();
  });
  window.addEventListener("hashchange", () => render());

  render();
  void regenerate(state.batchCount);
}
