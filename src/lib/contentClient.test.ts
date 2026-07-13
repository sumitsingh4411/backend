import { describe, it, expect } from "vitest";
import { contentUrl } from "./contentClient";
import { contentConfig } from "../config";

describe("contentUrl", () => {
  it("builds a local URL by default", () => {
    contentConfig.source = "local";
    expect(contentUrl("roadmap.json")).toContain("content/roadmap.json");
    expect(contentUrl("/00-foundations/x.md")).toContain(
      "content/00-foundations/x.md",
    );
  });

  it("builds a raw.githubusercontent URL in github mode", () => {
    contentConfig.source = "github";
    contentConfig.github = {
      owner: "octocat",
      repo: "backend",
      branch: "main",
      basePath: "content",
    };
    expect(contentUrl("roadmap.json")).toBe(
      "https://raw.githubusercontent.com/octocat/backend/main/content/roadmap.json",
    );
    // restore
    contentConfig.source = "local";
  });
});
