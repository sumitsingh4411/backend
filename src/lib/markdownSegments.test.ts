import { describe, it, expect } from "vitest";
import { parseLessonSegments, normalizeLang } from "./markdownSegments";

describe("normalizeLang", () => {
  it("maps aliases to canonical keys", () => {
    expect(normalizeLang("javascript")).toBe("js");
    expect(normalizeLang("Node")).toBe("js");
    expect(normalizeLang("py")).toBe("python");
    expect(normalizeLang("golang")).toBe("go");
    expect(normalizeLang("java")).toBe("java");
  });
  it("returns null for unknown langs", () => {
    expect(normalizeLang("sql")).toBeNull();
    expect(normalizeLang("bash")).toBeNull();
  });
});

describe("parseLessonSegments", () => {
  it("keeps plain markdown as one segment", () => {
    const segs = parseLessonSegments("# Title\n\nSome text.");
    expect(segs).toHaveLength(1);
    expect(segs[0]).toMatchObject({ type: "markdown" });
  });

  it("groups adjacent distinct known languages into code tabs", () => {
    const md = [
      "Intro",
      "",
      "```js",
      "console.log('hi')",
      "```",
      "",
      "```python",
      "print('hi')",
      "```",
      "",
      "```go",
      'fmt.Println("hi")',
      "```",
      "",
      "Outro",
    ].join("\n");
    const segs = parseLessonSegments(md);
    const tabs = segs.find((s) => s.type === "codetabs");
    expect(tabs).toBeDefined();
    if (tabs && tabs.type === "codetabs") {
      expect(tabs.snippets.map((s) => s.lang)).toEqual(["js", "python", "go"]);
    }
    // surrounded by two markdown segments
    expect(segs[0]).toMatchObject({ type: "markdown", content: "Intro" });
    expect(segs[segs.length - 1]).toMatchObject({ type: "markdown" });
  });

  it("renders a lone non-tab language as a single code block", () => {
    const md = "```sql\nSELECT 1;\n```";
    const segs = parseLessonSegments(md);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toMatchObject({ type: "code", lang: "sql" });
  });

  it("does not group two blocks of the same language", () => {
    const md = "```js\na\n```\n\n```js\nb\n```";
    const segs = parseLessonSegments(md);
    // two separate single code blocks, not one codetabs
    expect(segs.every((s) => s.type !== "codetabs")).toBe(true);
    expect(segs.filter((s) => s.type === "code")).toHaveLength(2);
  });
});
