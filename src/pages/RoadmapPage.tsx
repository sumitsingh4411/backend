import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRoadmap } from "../providers/RoadmapProvider";
import { useProgress } from "../providers/ProgressProvider";
import { groupIntoTracks } from "../lib/tracks";
import type { Lesson, Stage } from "../types";
import { ProgressRing } from "../components/ProgressRing";
import { ArrowRight, CheckIcon } from "../components/Icons";

export function RoadmapPage() {
  const { roadmap, flatLessons, totalLessons } = useRoadmap();
  const { completed, count, lastLessonId } = useProgress();
  const [drawn, setDrawn] = useState(false);

  // draw the progress line in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const currentId = useMemo(
    () => flatLessons.find((l) => !completed.has(l.lesson.id))?.lesson.id ?? null,
    [flatLessons, completed],
  );

  if (!roadmap) return null;
  const stages = [...roadmap.stages].sort((a, b) => a.order - b.order);
  const tracks = groupIntoTracks(stages);
  const pct = totalLessons ? count / totalLessons : 0;
  const resumeId = lastLessonId ?? currentId ?? flatLessons[0]?.lesson.id;

  // give each stage a global index for the node labels
  let stageIndex = 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      {/* header */}
      <header className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            the complete path
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-5xl">
            The Roadmap
          </h1>
          <p className="mt-3 max-w-md text-[15px] text-slate-500 dark:text-slate-400">
            {tracks.length} tracks · {stages.length} stages · {totalLessons}{" "}
            lessons. Follow it in order, or dive into any stage.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <ProgressRing value={pct} size={56} stroke={5} />
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold text-ink-900 dark:text-white">
              {count} / {totalLessons} done
            </p>
            {resumeId && (
              <Link
                to={`/lesson/${resumeId}`}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-400"
              >
                {count > 0 ? "Continue" : "Start"}
                <ArrowRight width={13} height={13} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* the animated timeline. All markers + the rail share ONE vertical axis:
          rail centre = left-5 / sm:left-7; markers use -translate-x-1/2 so their
          centres land on it too. */}
      <div className="relative pl-12 sm:pl-16">
        {/* dim rail */}
        <div className="absolute bottom-0 left-5 top-1 w-0.5 -translate-x-1/2 rounded-full bg-slate-200 dark:bg-white/[0.08] sm:left-7" />
        {/* bright progress line — draws in on mount, height = % complete */}
        <div
          className="absolute left-5 top-1 w-0.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-400 via-brand-400 to-accent-400 shadow-[0_0_14px_rgba(88,132,255,0.7)] transition-[height] duration-[1400ms] ease-out sm:left-7"
          style={{ height: drawn ? `calc(${pct * 100}% - 4px)` : "0%" }}
        />
        {/* travelling packet */}
        <div className="pointer-events-none absolute inset-y-0 left-5 -translate-x-1/2 motion-reduce:hidden sm:left-7">
          <span className="absolute -ml-[3px] h-1.5 w-1.5 animate-trace rounded-full bg-brand-300 shadow-[0_0_12px_2px_rgba(142,176,255,0.8)]" />
        </div>

        <div className="space-y-12">
          {tracks.map((track, ti) => (
            <section key={track.name}>
              {/* track header sits on the rail */}
              <div className="relative mb-6">
                <span className="absolute -left-7 top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center sm:-left-9">
                  <span className="h-2.5 w-2.5 rotate-45 rounded-[2px] border border-slate-300 bg-white dark:border-white/30 dark:bg-ink-950" />
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-100 font-mono text-[11px] font-bold text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">
                    {ti + 1}
                  </span>
                  <p className="font-display text-[15px] font-bold tracking-tight text-ink-900 dark:text-white">
                    {track.name}
                  </p>
                  <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:inline">
                    track
                  </span>
                </div>
                {track.blurb && (
                  <p className="mt-1 text-[13px] text-slate-400">{track.blurb}</p>
                )}
              </div>

              <div className="space-y-4">
                {track.stages.map((stage) => (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    index={stageIndex++}
                    currentId={currentId}
                    completed={completed}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* finish node */}
        <div className="relative mt-12">
          <span className="absolute -left-7 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl border border-accent-500/30 bg-accent-500/10 text-base sm:-left-9">
            🏁
          </span>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Reach the end and you can design, build, and run backend systems —
            end to end.
          </p>
        </div>
      </div>
    </div>
  );
}

function StageCard({
  stage,
  index,
  currentId,
  completed,
}: {
  stage: Stage;
  index: number;
  currentId: string | null;
  completed: Set<string>;
}) {
  const done = stage.lessons.filter((l) => completed.has(l.id)).length;
  const total = stage.lessons.length;
  const stageDone = done === total && total > 0;
  const mins = stage.lessons.reduce((n, l) => n + l.estMinutes, 0);
  const hasCurrent = stage.lessons.some((l) => l.id === currentId);

  const stagePct = total ? done / total : 0;

  const accent = stageDone
    ? "from-accent-400/70"
    : hasCurrent
      ? "from-brand-400/70"
      : "from-slate-300/80 dark:from-white/15";

  return (
    <div className="group/card relative animate-floatIn">
      {/* horizontal connector: node → card (aligned to the node's centre) */}
      <span
        className={`absolute left-[-10px] top-[34px] z-0 h-px w-2.5 bg-gradient-to-r to-transparent sm:left-[-18px] sm:w-[18px] ${accent}`}
      />

      {/* node on the rail — centre lands on the shared axis (-translate-x-1/2) */}
      <span className="absolute -left-7 top-4 z-10 -translate-x-1/2 sm:-left-9">
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl border text-[15px] shadow-sm transition ${
            stageDone
              ? "border-accent-500/50 bg-accent-500/15 shadow-glowAccent"
              : hasCurrent
                ? "animate-pulseNode border-brand-400/60 bg-brand-500/20"
                : "border-slate-200 bg-white group-hover/card:border-brand-400/50 dark:border-white/15 dark:bg-ink-850"
          }`}
        >
          {stage.icon}
        </span>
      </span>

      <div
        className={`relative overflow-hidden rounded-2xl border shadow-card backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-24px_rgba(88,132,255,0.4)] ${
          hasCurrent
            ? "border-brand-400/30 bg-gradient-to-b from-brand-500/[0.07] to-transparent dark:from-brand-500/[0.06] dark:to-white/[0.01]"
            : "border-slate-200/80 bg-gradient-to-b from-white/80 to-white/40 hover:border-brand-400/40 dark:border-white/[0.08] dark:from-white/[0.055] dark:to-white/[0.015]"
        }`}
      >
        {/* subtle top highlight — reads as "lit from above" */}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent dark:via-white/10" />

        {/* card header + a thin stage-progress bar along the bottom edge */}
        <div className="relative flex items-center gap-3 px-4 py-3.5">
          <span className="font-mono text-[11px] tabular-nums text-slate-300 dark:text-white/30">
            {String(index).padStart(2, "0")}
          </span>
          <h2 className="flex-1 font-display text-base font-bold tracking-tight text-ink-900 dark:text-white">
            {stage.title}
          </h2>
          <span className="hidden font-mono text-[11px] text-slate-400 sm:block">
            {Math.round(mins / 60) || 1}h
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums ${
              stageDone
                ? "bg-accent-500/15 text-accent-500"
                : "bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300"
            }`}
          >
            {stageDone ? "done" : `${done}/${total}`}
          </span>

          {/* progress bar hugging the header's bottom edge */}
          <span className="absolute inset-x-0 bottom-0 h-px bg-slate-200/70 dark:bg-white/[0.06]">
            <span
              className="block h-full bg-gradient-to-r from-brand-400 to-accent-400 transition-[width] duration-500"
              style={{ width: `${stagePct * 100}%` }}
            />
          </span>
        </div>

        {/* lessons */}
        <ul className="grid gap-x-2 px-2 pb-2.5 pt-1.5 sm:grid-cols-2">
          {stage.lessons.map((lesson) => (
            <LessonLine
              key={lesson.id}
              lesson={lesson}
              done={completed.has(lesson.id)}
              current={lesson.id === currentId}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function LessonLine({
  lesson,
  done,
  current,
}: {
  lesson: Lesson;
  done: boolean;
  current: boolean;
}) {
  return (
    <li>
      <Link
        to={`/lesson/${lesson.id}`}
        className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition ${
          current
            ? "bg-gradient-to-r from-brand-500/[0.14] to-brand-500/[0.02] ring-1 ring-inset ring-brand-400/25"
            : "hover:bg-slate-100/70 dark:hover:bg-white/[0.04]"
        }`}
      >
        <span
          className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition ${
            done
              ? "border-accent-500/50 bg-accent-500/20 text-accent-400"
              : current
                ? "border-brand-400 bg-brand-400/20"
                : "border-slate-300 group-hover:border-brand-400/60 dark:border-white/20"
          }`}
        >
          {done && <CheckIcon width={10} height={10} />}
        </span>
        <span
          className={`flex-1 truncate text-[13px] ${
            done
              ? "text-slate-400 dark:text-slate-500"
              : current
                ? "font-medium text-ink-900 dark:text-white"
                : "text-slate-600 group-hover:text-ink-900 dark:text-slate-300 dark:group-hover:text-white"
          }`}
        >
          {lesson.title}
        </span>
        {current ? (
          <span className="shrink-0 rounded-full bg-brand-500 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-white">
            next
          </span>
        ) : (
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-400">
            {lesson.estMinutes}m
          </span>
        )}
      </Link>
    </li>
  );
}
