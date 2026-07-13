import { useEffect, useState } from "react";
import type { TocItem } from "./toc";

/**
 * Highlights the section you're currently reading.
 *
 * Of the elements inside the "reading band" (just under the sticky header,
 * down to ~a third of the viewport), the topmost one wins. Returns the active
 * id plus a setter, so a click can light up its target immediately instead of
 * waiting for the scroll to land.
 */
export function useScrollSpy(items: TocItem[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!items.length || typeof IntersectionObserver === "undefined") return;

    const elements = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-88px 0px -66% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return [active, setActive] as const;
}
