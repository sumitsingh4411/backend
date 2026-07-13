import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import { useRoadmap } from "../providers/RoadmapProvider";
import { useProgress } from "../providers/ProgressProvider";
import { SearchIcon, CheckIcon } from "./Icons";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Item {
  id: string;
  title: string;
  stage: string;
}

export function CommandPalette({ open, onClose }: Props) {
  const { flatLessons } = useRoadmap();
  const { isComplete } = useProgress();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const items = useMemo<Item[]>(
    () =>
      flatLessons.map((l) => ({
        id: l.lesson.id,
        title: l.lesson.title,
        stage: l.stage.title,
      })),
    [flatLessons],
  );

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: [
          { name: "title", weight: 0.7 },
          { name: "stage", weight: 0.3 },
        ],
        threshold: 0.4,
      }),
    [items],
  );

  const results = useMemo<Item[]>(() => {
    if (!query.trim()) return items.slice(0, 8);
    return fuse.search(query).slice(0, 10).map((r) => r.item);
  }, [query, fuse, items]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // focus after paint
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const go = (id: string) => {
    navigate(`/lesson/${id}`);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) go(results[active].id);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" />
      <div
        className="glass relative w-full max-w-xl overflow-hidden rounded-2xl shadow-card"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-slate-200/60 px-4 dark:border-white/10">
          <SearchIcon className="text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons…"
            className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden rounded border border-slate-300/60 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 dark:border-white/15 sm:block">
            ESC
          </kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-slate-400">
              No lessons match “{query}”.
            </li>
          )}
          {results.map((item, i) => (
            <li key={item.id}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${
                  i === active
                    ? "bg-brand-500/10 text-ink-900 dark:text-white"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {isComplete(item.id) ? (
                    <CheckIcon width={15} height={15} className="text-accent-500" />
                  ) : (
                    <span className="h-[15px] w-[15px] rounded-full border border-slate-300 dark:border-white/20" />
                  )}
                  <span className="text-sm font-medium">{item.title}</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {item.stage}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
