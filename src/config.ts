/**
 * Content source configuration.
 *
 * The same content lives once in `public/content/` and is committed to the repo.
 *  - source: "local"  → fetches from `/<basePath>/...` (served by Vite in dev,
 *                        or from the deployed site's own domain in production).
 *  - source: "github" → fetches from raw.githubusercontent.com for the repo below.
 *
 * To go live from a GitHub repo: push this project (including public/content),
 * set `source: "github"`, fill in owner/repo/branch, and rebuild.
 */
export type ContentSource = "local" | "github";

export interface ContentConfig {
  source: ContentSource;
  github: {
    owner: string;
    repo: string;
    branch: string;
    /** Folder within the repo that holds roadmap.json + lesson markdown. */
    basePath: string;
  };
}

export const contentConfig: ContentConfig = {
  source: "local",
  github: {
    owner: "your-username",
    repo: "backend-roadmap-content",
    branch: "main",
    basePath: "content",
  },
};

/** Local base path (relative to the site root). Matches public/content. */
export const LOCAL_BASE_PATH = "content";
