import type { Stage } from "../types";

/**
 * Tracks group the roadmap's stages into a few higher-level phases, so the nav
 * reads as "Foundations → APIs & Data → Scale & Ops → Mastery" instead of a
 * flat list of 11 stages. Presentation-only, derived from stage ids.
 */
export interface Track {
  name: string;
  blurb: string;
  stageIds: string[];
}

export const TRACKS: Track[] = [
  {
    name: "Foundations",
    blurb: "How the web moves data, and the language every backend speaks.",
    stageIds: ["foundations", "http", "servers"],
  },
  {
    name: "APIs & Data",
    blurb: "Expose your backend, store its data, and lock it down.",
    stageIds: ["apis", "databases", "security"],
  },
  {
    name: "Scale & Ops",
    blurb: "Make it fast, resilient, and shippable under real load.",
    stageIds: ["beyond", "architecture", "devops"],
  },
  {
    name: "Mastery",
    blurb: "Design whole systems and see inside the machine.",
    stageIds: ["system-design", "expert"],
  },
];

export interface TrackWithStages extends Track {
  stages: Stage[];
}

/** Group ordered stages under their track, preserving roadmap order. */
export function groupIntoTracks(stages: Stage[]): TrackWithStages[] {
  const byId = new Map(stages.map((s) => [s.id, s]));
  const grouped = TRACKS.map((t) => ({
    ...t,
    stages: t.stageIds
      .map((id) => byId.get(id))
      .filter((s): s is Stage => s !== undefined),
  }));

  // Any stage not listed in a track falls into a trailing "More" track, so the
  // nav can never silently drop a stage.
  const placed = new Set(TRACKS.flatMap((t) => t.stageIds));
  const orphans = stages.filter((s) => !placed.has(s.id));
  if (orphans.length) {
    grouped.push({
      name: "More",
      blurb: "",
      stageIds: orphans.map((s) => s.id),
      stages: orphans,
    });
  }
  return grouped.filter((t) => t.stages.length > 0);
}
