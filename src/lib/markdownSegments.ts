import type { LangKey } from "../providers/PreferencesProvider";

/**
 * Splits a lesson's markdown into renderable segments:
 *  - plain markdown chunks
 *  - single fenced code blocks (any language)
 *  - "code tabs": a run of adjacent fenced blocks in distinct known languages
 *    (JavaScript, Python, Go, Java) rendered as one tabbed component.
 */

export interface CodeSnippet {
  lang: LangKey;
  code: string;
}

export type Segment =
  | { type: "markdown"; content: string }
  | { type: "code"; lang: string; code: string }
  | { type: "codetabs"; snippets: CodeSnippet[] };

const LANG_ALIASES: Record<string, LangKey> = {
  js: "js",
  javascript: "js",
  node: "js",
  nodejs: "js",
  python: "python",
  py: "python",
  go: "go",
  golang: "go",
  java: "java",
};

export function normalizeLang(raw: string): LangKey | null {
  return LANG_ALIASES[raw.trim().toLowerCase()] ?? null;
}

type Token =
  | { kind: "text"; content: string }
  | { kind: "code"; lang: string; code: string };

/** Tokenize markdown into text runs and top-level fenced code blocks. */
function tokenize(markdown: string): Token[] {
  const lines = markdown.split("\n");
  const tokens: Token[] = [];
  let textBuf: string[] = [];

  const flushText = () => {
    if (textBuf.length) {
      tokens.push({ kind: "text", content: textBuf.join("\n") });
      textBuf = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const fence = lines[i].match(/^(```+|~~~+)\s*([\w-]*)\s*$/);
    if (fence) {
      const marker = fence[1][0]; // ` or ~
      const lang = fence[2] ?? "";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !new RegExp(`^${marker === "`" ? "`" : "~"}{3,}\\s*$`).test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      flushText();
      tokens.push({ kind: "code", lang, code: codeLines.join("\n") });
    } else {
      textBuf.push(lines[i]);
    }
  }
  flushText();
  return tokens;
}

const isBlank = (t: Token) => t.kind === "text" && t.content.trim() === "";

export function parseLessonSegments(markdown: string): Segment[] {
  const tokens = tokenize(markdown);
  const segments: Segment[] = [];

  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];

    if (tok.kind === "text") {
      if (tok.content.trim() !== "") {
        // Strip leading/trailing blank lines but keep indentation on the
        // first line (it can be significant for nested markdown).
        segments.push({
          type: "markdown",
          content: tok.content.replace(/^\n+|\n+$/g, ""),
        });
      }
      i++;
      continue;
    }

    // tok.kind === "code": try to build a code-tabs run of distinct known langs.
    const run: { lang: LangKey; code: string }[] = [];
    const seen = new Set<LangKey>();
    let j = i;
    while (j < tokens.length) {
      const t = tokens[j];
      if (t.kind === "code") {
        const norm = normalizeLang(t.lang);
        if (norm && !seen.has(norm)) {
          run.push({ lang: norm, code: t.code });
          seen.add(norm);
          j++;
          continue;
        }
        break;
      }
      // text between code blocks: only skip if it is blank (adjacency)
      if (isBlank(t) && j + 1 < tokens.length && tokens[j + 1].kind === "code") {
        const nextNorm = normalizeLang((tokens[j + 1] as { lang: string }).lang);
        if (nextNorm && !seen.has(nextNorm)) {
          j++;
          continue;
        }
      }
      break;
    }

    if (run.length >= 2) {
      segments.push({ type: "codetabs", snippets: run });
      i = j;
    } else {
      segments.push({ type: "code", lang: tok.lang || "text", code: tok.code });
      i++;
    }
  }

  return segments;
}
