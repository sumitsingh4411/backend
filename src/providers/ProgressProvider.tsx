import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const PROGRESS_KEY = "br:progress";
const LAST_KEY = "br:last-lesson";

interface ProgressValue {
  completed: Set<string>;
  isComplete: (lessonId: string) => boolean;
  toggleComplete: (lessonId: string) => void;
  setComplete: (lessonId: string, done: boolean) => void;
  reset: () => void;
  count: number;
  lastLessonId: string | null;
  setLastLesson: (lessonId: string) => void;
}

const ProgressContext = createContext<ProgressValue | null>(null);

function loadCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((x) => typeof x === "string")) : new Set();
  } catch {
    return new Set();
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completed, setCompleted] = useState<Set<string>>(loadCompleted);
  const [lastLessonId, setLastLessonId] = useState<string | null>(
    () => localStorage.getItem(LAST_KEY),
  );

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...completed]));
  }, [completed]);

  const setComplete = useCallback((lessonId: string, done: boolean) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (done) next.add(lessonId);
      else next.delete(lessonId);
      return next;
    });
  }, []);

  const toggleComplete = useCallback((lessonId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  }, []);

  const reset = useCallback(() => setCompleted(new Set()), []);

  const setLastLesson = useCallback((lessonId: string) => {
    setLastLessonId(lessonId);
    localStorage.setItem(LAST_KEY, lessonId);
  }, []);

  const value = useMemo<ProgressValue>(
    () => ({
      completed,
      isComplete: (id) => completed.has(id),
      toggleComplete,
      setComplete,
      reset,
      count: completed.size,
      lastLessonId,
      setLastLesson,
    }),
    [completed, toggleComplete, setComplete, reset, lastLessonId, setLastLesson],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProgress(): ProgressValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
