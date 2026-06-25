/**
 * Minimal, safe DOM helpers. Secrets and user text are only ever set via
 * `textContent` / text nodes — never `innerHTML` — so there is no HTML-injection
 * surface anywhere in the app.
 */

type Attrs = Record<string, string | number | boolean | undefined>;
type Child = Node | string | null | undefined | false;

const PROPERTY_KEYS = new Set(["value", "checked", "disabled", "textContent", "type", "min", "max", "step"]);

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: Child[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key === "class") node.className = String(value);
    else if (PROPERTY_KEYS.has(key)) (node as unknown as Record<string, unknown>)[key] = value;
    else node.setAttribute(key, String(value));
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

export function clear(node: Node): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function on<K extends keyof HTMLElementEventMap>(
  node: HTMLElement,
  event: K,
  handler: (ev: HTMLElementEventMap[K]) => void,
): void {
  node.addEventListener(event, handler);
}

/** Resolve a required mount point or throw early with a clear message. */
export function mountPoint(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) throw new Error(`mount point #${id} not found`);
  return node;
}
