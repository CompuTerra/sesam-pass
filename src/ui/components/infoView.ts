import type { Lang } from "../../core/types";
import { el } from "../dom";
import { infoSections } from "../info/content";

/** Render the educational "Info & security" view (lazy-loaded). */
export function infoView(lang: Lang): HTMLElement {
  const wrap = el("div", { class: "info" });

  for (const section of infoSections(lang)) {
    const children: HTMLElement[] = [el("h2", { class: "info__title" }, [section.title])];

    for (const p of section.paragraphs) children.push(el("p", { class: "info__p" }, [p]));

    if (section.bullets && section.bullets.length > 0) {
      children.push(
        el("ul", { class: "info__list" }, section.bullets.map((b) => el("li", {}, [b]))),
      );
    }
    if (section.links && section.links.length > 0) {
      children.push(
        el(
          "ul",
          { class: "info__links" },
          section.links.map((link) =>
            el("li", {}, [
              el("a", { href: link.href, target: "_blank", rel: "noopener noreferrer" }, [link.label]),
            ]),
          ),
        ),
      );
    }

    wrap.append(el("section", { class: "panel info__section" }, children));
  }

  return wrap;
}
