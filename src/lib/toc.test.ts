import { describe, it, expect } from "vitest";
import { extractToc, slugify } from "./toc";

describe("slugify", () => {
  it("lowercases and dashes", () => {
    expect(slugify("Anatomy of a Request")).toBe("anatomy-of-a-request");
  });
  it("strips emoji and punctuation", () => {
    expect(slugify("🚨 The dual-write problem!")).toBe("the-dual-write-problem");
  });
  it("never returns an empty slug", () => {
    expect(slugify("🎉")).toBe("section");
  });
});

describe("extractToc", () => {
  it("pulls h2 and h3 in document order, ignoring h1", () => {
    const md = [
      "# Lesson Title",
      "",
      "Intro text.",
      "",
      "## First Section",
      "body",
      "### A Detail",
      "more",
      "## Second Section",
    ].join("\n");

    expect(extractToc(md)).toEqual([
      { id: "first-section", text: "First Section", level: 2 },
      { id: "a-detail", text: "A Detail", level: 3 },
      { id: "second-section", text: "Second Section", level: 2 },
    ]);
  });

  it("ignores '#' lines inside fenced code blocks", () => {
    const md = [
      "## Real Heading",
      "",
      "```bash",
      "# this is a shell comment, NOT a heading",
      "## neither is this",
      "```",
      "",
      "## Another Real Heading",
    ].join("\n");

    const toc = extractToc(md);
    expect(toc.map((t) => t.text)).toEqual([
      "Real Heading",
      "Another Real Heading",
    ]);
  });

  it("strips inline markdown but keeps emoji in the label", () => {
    const md = "## 🚨 The **dual-write** `problem`";
    const [item] = extractToc(md);
    expect(item.text).toBe("🚨 The dual-write problem");
    expect(item.id).toBe("the-dual-write-problem");
  });

  it("de-duplicates repeated headings so ids stay unique", () => {
    const md = ["## The fix", "a", "## The fix", "b", "## The fix"].join("\n");
    expect(extractToc(md).map((t) => t.id)).toEqual([
      "the-fix",
      "the-fix-1",
      "the-fix-2",
    ]);
  });
});
