import { contentConfig, LOCAL_BASE_PATH } from "../config";
import type { Roadmap } from "../types";

/** Build a URL for a file inside the content directory, per the active source. */
export function contentUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, "");
  if (contentConfig.source === "github") {
    const { owner, repo, branch, basePath } = contentConfig.github;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${basePath}/${clean}`;
  }
  // local: served from the site root (public/content/...)
  return `${import.meta.env.BASE_URL}${LOCAL_BASE_PATH}/${clean}`;
}

export class ContentError extends Error {
  constructor(
    message: string,
    readonly kind: "network" | "not-found" | "rate-limit" | "parse",
  ) {
    super(message);
    this.name = "ContentError";
  }
}

async function fetchText(url: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-cache" });
  } catch {
    throw new ContentError(
      "Could not reach the content source. Check your connection or config.",
      "network",
    );
  }
  if (res.status === 403) {
    throw new ContentError(
      "GitHub rate limit reached. Try again later or switch to local content.",
      "rate-limit",
    );
  }
  if (res.status === 404) {
    throw new ContentError(`Content not found: ${url}`, "not-found");
  }
  if (!res.ok) {
    throw new ContentError(`Failed to load content (${res.status}).`, "network");
  }
  return res.text();
}

/** Load and validate the roadmap manifest. */
export async function fetchRoadmap(): Promise<Roadmap> {
  const raw = await fetchText(contentUrl("roadmap.json"));
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new ContentError("roadmap.json is not valid JSON.", "parse");
  }
  assertRoadmap(data);
  return data;
}

/** Load a single lesson's markdown by its relative file path. */
export async function fetchLessonMarkdown(file: string): Promise<string> {
  return fetchText(contentUrl(file));
}

function assertRoadmap(data: unknown): asserts data is Roadmap {
  if (typeof data !== "object" || data === null) {
    throw new ContentError("roadmap.json must be an object.", "parse");
  }
  const rm = data as Record<string, unknown>;
  if (!Array.isArray(rm.stages)) {
    throw new ContentError("roadmap.json is missing a `stages` array.", "parse");
  }
  rm.stages.forEach((stage, si) => {
    const s = stage as Record<string, unknown>;
    if (typeof s.id !== "string" || !Array.isArray(s.lessons)) {
      throw new ContentError(
        `Stage #${si} is malformed (needs id + lessons).`,
        "parse",
      );
    }
    (s.lessons as unknown[]).forEach((lesson, li) => {
      const l = lesson as Record<string, unknown>;
      if (typeof l.id !== "string" || typeof l.file !== "string") {
        throw new ContentError(
          `Lesson #${li} in stage "${s.id}" is malformed (needs id + file).`,
          "parse",
        );
      }
    });
  });
}
