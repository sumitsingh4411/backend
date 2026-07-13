import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchRoadmap, ContentError } from "../lib/contentClient";
import type { Lesson, LessonLocation, Roadmap } from "../types";

interface RoadmapValue {
  roadmap: Roadmap | null;
  loading: boolean;
  error: ContentError | null;
  reload: () => void;
  /** Flattened, ordered list of all lessons with their stage + index. */
  flatLessons: LessonLocation[];
  totalLessons: number;
  locate: (lessonId: string) => LessonLocation | undefined;
}

const RoadmapContext = createContext<RoadmapValue | null>(null);

export function RoadmapProvider({ children }: { children: ReactNode }) {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ContentError | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchRoadmap()
      .then((rm) => {
        if (!cancelled) setRoadmap(rm);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof ContentError
              ? err
              : new ContentError("Unexpected error loading roadmap.", "network"),
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const flatLessons = useMemo<LessonLocation[]>(() => {
    if (!roadmap) return [];
    const out: LessonLocation[] = [];
    let index = 0;
    for (const stage of [...roadmap.stages].sort((a, b) => a.order - b.order)) {
      for (const lesson of stage.lessons) {
        out.push({ lesson, stage, index: index++ });
      }
    }
    return out;
  }, [roadmap]);

  const byId = useMemo(() => {
    const map = new Map<string, LessonLocation>();
    for (const loc of flatLessons) map.set(loc.lesson.id, loc);
    return map;
  }, [flatLessons]);

  const value = useMemo<RoadmapValue>(
    () => ({
      roadmap,
      loading,
      error,
      reload: () => setNonce((n) => n + 1),
      flatLessons,
      totalLessons: flatLessons.length,
      locate: (id: string) => byId.get(id),
    }),
    [roadmap, loading, error, flatLessons, byId],
  );

  return (
    <RoadmapContext.Provider value={value}>{children}</RoadmapContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRoadmap(): RoadmapValue {
  const ctx = useContext(RoadmapContext);
  if (!ctx) throw new Error("useRoadmap must be used within RoadmapProvider");
  return ctx;
}

export type { Lesson };
