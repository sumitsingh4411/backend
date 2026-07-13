import { parseLessonSegments } from "./markdownSegments";

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/** URL-safe anchor id. Emoji/punctuation are dropped; spaces become dashes. */
export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "") // strip emoji + punctuation
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return slug || "section";
}

/** Strip inline markdown so the TOC shows plain text (emoji are kept). */
function cleanHeading(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [text](url) → text
    .replace(/`([^`]+)`/g, "$1") // `code` → code
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **bold**
    .replace(/\*([^*]+)\*/g, "$1") // *italic*
    .trim();
}

/**
 * Pull h2/h3 headings out of a lesson, in document order.
 *
 * Uses parseLessonSegments so that `#` lines *inside fenced code blocks* are
 * never mistaken for headings. Duplicate slugs get a numeric suffix, so the
 * ids stay unique and line up 1:1 with the rendered <h2>/<h3> elements.
 */
export function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const seen = new Map<string, number>();

  for (const segment of parseLessonSegments(markdown)) {
    if (segment.type !== "markdown") continue;

    for (const line of segment.content.split("\n")) {
      const match = line.match(/^(#{2,3})\s+(.+?)\s*$/);
      if (!match) continue;

      const level = match[1].length as 2 | 3;
      const text = cleanHeading(match[2]);
      if (!text) continue;

      const base = slugify(text);
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);

      items.push({ id: count === 0 ? base : `${base}-${count}`, text, level });
    }
  }

  return items;
}
