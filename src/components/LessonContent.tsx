import { useEffect, useMemo, useRef } from "react";
import { parseLessonSegments } from "../lib/markdownSegments";
import type { TocItem } from "../lib/toc";
import { Markdown } from "./Markdown";
import { CodeBlock } from "./CodeBlock";
import { CodeTabs } from "./CodeTabs";

/** Renders a full lesson: interleaves markdown prose with single code blocks
 *  and multi-language code-tab groups. */
export function LessonContent({
  markdown,
  toc = [],
}: {
  markdown: string;
  toc?: TocItem[];
}) {
  const segments = useMemo(() => parseLessonSegments(markdown), [markdown]);
  const ref = useRef<HTMLDivElement>(null);

  // Assign anchor ids to the rendered headings. `toc` was extracted from the
  // same markdown in the same order, so index i lines up with heading i — which
  // keeps duplicate heading texts unambiguous.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const headings = root.querySelectorAll<HTMLElement>("h2, h3");
    toc.forEach((item, i) => {
      if (headings[i]) headings[i].id = item.id;
    });
  }, [toc, markdown]);

  return (
    <div ref={ref} className="prose-content">
      {segments.map((seg, i) => {
        if (seg.type === "markdown")
          return <Markdown key={i} content={seg.content} />;
        if (seg.type === "code")
          return <CodeBlock key={i} lang={seg.lang} code={seg.code} />;
        return <CodeTabs key={i} snippets={seg.snippets} />;
      })}
    </div>
  );
}
