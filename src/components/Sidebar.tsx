import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useRoadmap } from "../providers/RoadmapProvider";
import { useProgress } from "../providers/ProgressProvider";
import { groupIntoTracks } from "../lib/tracks";
import type { Lesson, Stage } from "../types";
import { ArrowLeft, CheckIcon } from "./Icons";

export function Sidebar({
  activeLessonId,
  onNavigate,
}: {
  activeLessonId: string;
  onNavigate?: () => void;
}) {
  const { roadmap, totalLessons } = useRoadmap();
  const { completed, count } = useProgress();
  const pct = totalLessons ? Math.round((count / totalLessons) * 100) : 0;

  if (!roadmap) return null;
  const stages = [...roadmap.stages].sort((a, b) => a.order - b.order);
  const activeStageId = stages.find((s) =>
    s.lessons.some((l) => l.id === activeLessonId),
  )?.id;
  const tracks = groupIntoTracks(stages);

  return (
    // min-h-0 lets the scroll area actually shrink inside the flex column
    <nav className="flex h-full min-h-0 flex-col">
      {/* header: back link + thin progress bar */}
      <div className="shrink-0 px-5 pb-4 pt-5">
        <Link
          to="/roadmap"
          onClick={onNavigate}
          className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400 transition hover:text-ink-900 dark:hover:text-white"
        >
          <ArrowLeft
            width={13}
            height={13}
            className="transition group-hover:-translate-x-0.5"
          />
          All stages
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-accent-400 transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-mono text-[11px] tabular-nums text-slate-400">
            {pct}%
          </span>
        </div>
      </div>

      {/* tracks → stages */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-8">
        {tracks.map((track, ti) => (
          <div key={track.name} className="mb-6">
            <p className="mb-2 px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span className="text-slate-300 dark:text-white/25">
                Track {ti + 1}
              </span>
              <span className="mx-1.5 text-slate-300 dark:text-white/20">·</span>
              {track.name}
            </p>

            <div className="space-y-0.5">
              {track.stages.map((stage) => (
                <StageItem
                  key={stage.id}
                  stage={stage}
                  active={stage.id === activeStageId}
                  activeLessonId={activeLessonId}
                  completed={completed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}

function StageItem({
  stage,
  active,
  activeLessonId,
  completed,
  onNavigate,
}: {
  stage: Stage;
  active: boolean;
  activeLessonId: string;
  completed: Set<string>;
  onNavigate?: () => void;
}) {
  const done = stage.lessons.filter((l) => completed.has(l.id)).length;
  const total = stage.lessons.length;
  const stageDone = done === total && total > 0;
  const firstLessonId = stage.lessons[0]?.id;

  return (
    <div>
      {/* stage row: emoji · title · count */}
      <Link
        to={`/lesson/${active ? activeLessonId : firstLessonId}`}
        onClick={onNavigate}
        className={`group flex items-start gap-3 rounded-lg px-2 py-2 transition ${
          active
            ? "bg-slate-100 dark:bg-white/[0.04]"
            : "hover:bg-slate-100/70 dark:hover:bg-white/[0.03]"
        }`}
      >
        <span className="mt-px w-5 shrink-0 text-center text-[15px] leading-6">
          {stage.icon}
        </span>
        <span
          className={`flex-1 text-[13.5px] leading-6 ${
            active
              ? "font-semibold text-ink-900 dark:text-white"
              : "font-medium text-slate-600 dark:text-slate-300"
          }`}
        >
          {stage.title}
        </span>
        <span
          className={`mt-0.5 shrink-0 font-mono text-[11px] tabular-nums ${
            stageDone ? "text-accent-500" : "text-slate-400"
          }`}
        >
          {stageDone ? (
            <CheckIcon width={13} height={13} className="inline" />
          ) : done > 0 ? (
            `${done}/${total}`
          ) : (
            total
          )}
        </span>
      </Link>

      {/* lessons of the active stage */}
      {active && (
        <ul className="ml-[26px] mt-0.5 border-l border-slate-200 dark:border-white/10">
          {stage.lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              active={lesson.id === activeLessonId}
              done={completed.has(lesson.id)}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function LessonRow({
  lesson,
  active,
  done,
  onNavigate,
}: {
  lesson: Lesson;
  active: boolean;
  done: boolean;
  onNavigate?: () => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (active) ref.current?.scrollIntoView?.({ block: "nearest" });
  }, [active]);

  return (
    <li>
      <Link
        ref={ref}
        to={`/lesson/${lesson.id}`}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`-ml-px flex items-center gap-2 border-l-2 py-1.5 pl-3.5 pr-2 text-[12.5px] transition ${
          active
            ? "border-brand-400 bg-gradient-to-r from-brand-500/[0.14] to-transparent font-medium text-brand-600 dark:text-brand-200"
            : "border-transparent text-slate-500 hover:border-slate-300 hover:text-ink-900 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white"
        }`}
      >
        <span
          className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border ${
            done
              ? "border-accent-500/50 bg-accent-500/20 text-accent-400"
              : active
                ? "border-brand-400"
                : "border-slate-300 dark:border-white/15"
          }`}
        >
          {done && <CheckIcon width={9} height={9} />}
        </span>
        <span className={`flex-1 truncate ${done && !active ? "text-slate-400" : ""}`}>
          {lesson.title}
        </span>
      </Link>
    </li>
  );
}
