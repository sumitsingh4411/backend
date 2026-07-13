/** Shared domain types for the backend roadmap. */

export interface QuizQuestion {
  q: string;
  options: string[];
  /** Index into `options` of the correct answer. */
  answer: number;
  explain: string;
}

/** Kind of external resource — drives the badge shown in "Further reading". */
export type ResourceType =
  | "docs"
  | "article"
  | "video"
  | "book"
  | "spec"
  | "course"
  | "tool"
  | "interactive";

export interface Resource {
  title: string;
  url: string;
  type: ResourceType;
  /** Optional one-line note on why this link is worth reading. */
  note?: string;
}

export interface Lesson {
  id: string;
  title: string;
  /** Path to the markdown file, relative to the content basePath. */
  file: string;
  estMinutes: number;
  quiz?: QuizQuestion[];
  /** Curated external links for going deeper on this topic. */
  resources?: Resource[];
}

export interface Stage {
  id: string;
  order: number;
  title: string;
  summary: string;
  /** Emoji or short glyph used in the roadmap graph. */
  icon?: string;
  lessons: Lesson[];
}

export interface Roadmap {
  title: string;
  stages: Stage[];
}

/** A lesson enriched with its stage + flat position, for navigation. */
export interface LessonLocation {
  lesson: Lesson;
  stage: Stage;
  /** 0-based index in the flattened lesson list. */
  index: number;
}
