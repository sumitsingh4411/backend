import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRoadmap } from "../providers/RoadmapProvider";
import { useProgress } from "../providers/ProgressProvider";
import { fetchLessonMarkdown, ContentError } from "../lib/contentClient";
import { extractToc } from "../lib/toc";
import { Sidebar } from "../components/Sidebar";
import { TableOfContents } from "../components/TableOfContents";
import { LessonContent } from "../components/LessonContent";
import { Quiz } from "../components/Quiz";
import { Resources } from "../components/Resources";
import {
  ArrowLeft,
  ArrowRight,
  CheckIcon,
  CloseIcon,
  MenuIcon,
} from "../components/Icons";

export function LessonPage() {
  const { id = "" } = useParams();
  const { locate, flatLessons } = useRoadmap();
  const { isComplete, toggleComplete, setLastLesson } = useProgress();

  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<ContentError | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const location = locate(id);

  // headings for the "On this page" rail
  const toc = useMemo(() => (markdown ? extractToc(markdown) : []), [markdown]);

  useEffect(() => {
    if (location) setLastLesson(id);
  }, [id, location, setLastLesson]);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setMarkdown(null);
    setError(null);
    window.scrollTo({ top: 0 });
    fetchLessonMarkdown(location.lesson.file)
      .then((md) => !cancelled && setMarkdown(md))
      .catch(
        (err) =>
          !cancelled &&
          setError(
            err instanceof ContentError
              ? err
              : new ContentError("Failed to load lesson.", "network"),
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [location, id]);

  if (!location) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-center">
        <div>
          <p className="mb-2 text-5xl">🧭</p>
          <h1 className="mb-1 text-xl font-bold text-ink-900 dark:text-white">
            Lesson not found
          </h1>
          <p className="mb-5 text-sm text-slate-400">
            “{id}” isn’t part of the roadmap.
          </p>
          <Link to="/" className="btn-primary mx-auto">
            Back to roadmap
          </Link>
        </div>
      </div>
    );
  }

  const { lesson, stage, index } = location;
  const prev = index > 0 ? flatLessons[index - 1] : null;
  const next = index < flatLessons.length - 1 ? flatLessons[index + 1] : null;
  const done = isComplete(lesson.id);

  return (
    <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_248px]">
      {/* LEFT: lesson nav — a flush docs pane with a single divider, no card.
          Definite height (not max-h) so the inner list scrolls, not clips. */}
      <aside className="hidden border-r border-slate-200/70 lg:block dark:border-white/10">
        <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
          <Sidebar activeLessonId={lesson.id} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" />
          <div
            className="glass absolute left-0 top-0 flex h-full w-[85%] max-w-xs flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 justify-end p-2">
              <button
                onClick={() => setDrawerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/5"
                aria-label="Close menu"
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <Sidebar
                activeLessonId={lesson.id}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content — centered with a comfortable reading measure */}
      <article className="mx-auto w-full min-w-0 max-w-3xl px-5 py-8 sm:px-8 lg:px-10 xl:px-12">
        {/* breadcrumb + mobile menu */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
            <Link to="/roadmap" className="hover:text-brand-400">
              Roadmap
            </Link>
            <span>/</span>
            <span>{stage.title}</span>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="btn-ghost !px-2.5 !py-1.5 lg:hidden"
            aria-label="Open lessons"
          >
            <MenuIcon width={16} height={16} />
            Lessons
          </button>
        </div>

        <div className="mb-1 flex items-center gap-3">
          <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-brand-300">
            {stage.icon ? `${stage.icon} ` : ""}
            {stage.title}
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            {lesson.estMinutes} min read
          </span>
        </div>
        <h1 className="mb-6 font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-[2.5rem] sm:leading-[1.1]">
          {lesson.title}
        </h1>

        {/* body */}
        {error ? (
          <LessonError
            message={error.message}
            onRetry={() => {
              // trigger refetch by toggling markdown to null via effect deps
              setError(null);
              setMarkdown(null);
              fetchLessonMarkdown(lesson.file)
                .then(setMarkdown)
                .catch((e) =>
                  setError(
                    e instanceof ContentError
                      ? e
                      : new ContentError("Failed to load lesson.", "network"),
                  ),
                );
            }}
          />
        ) : markdown === null ? (
          <LessonSkeleton />
        ) : (
          <>
            <LessonContent markdown={markdown} toc={toc} />
            {lesson.quiz && lesson.quiz.length > 0 && (
              <Quiz questions={lesson.quiz} />
            )}
            {lesson.resources && lesson.resources.length > 0 && (
              <Resources resources={lesson.resources} />
            )}
          </>
        )}

        {/* footer nav */}
        <footer className="mt-12 border-t border-slate-200/70 pt-6 dark:border-white/10">
          <button
            onClick={() => toggleComplete(lesson.id)}
            className={
              done
                ? "inline-flex items-center gap-2 rounded-xl border border-accent-500/40 bg-accent-500/10 px-4 py-2 text-sm font-semibold text-accent-500 transition"
                : "btn-primary"
            }
          >
            <CheckIcon width={16} height={16} />
            {done ? "Completed" : "Mark as complete"}
          </button>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link
                to={`/lesson/${prev.lesson.id}`}
                className="group glass flex items-center gap-3 rounded-xl px-4 py-3 transition hover:border-brand-400/40"
              >
                <ArrowLeft
                  width={18}
                  height={18}
                  className="text-slate-400 transition group-hover:text-brand-400"
                />
                <span className="min-w-0">
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    Previous
                  </span>
                  <span className="block truncate text-sm font-medium text-ink-900 dark:text-slate-200">
                    {prev.lesson.title}
                  </span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                to={`/lesson/${next.lesson.id}`}
                className="group glass flex items-center justify-end gap-3 rounded-xl px-4 py-3 text-right transition hover:border-brand-400/40 sm:col-start-2"
              >
                <span className="min-w-0">
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    Next
                  </span>
                  <span className="block truncate text-sm font-medium text-ink-900 dark:text-slate-200">
                    {next.lesson.title}
                  </span>
                </span>
                <ArrowRight
                  width={18}
                  height={18}
                  className="text-slate-400 transition group-hover:text-brand-400"
                />
              </Link>
            )}
          </div>
        </footer>
      </article>

      {/* RIGHT: "On this page". Rendered AFTER the article so its scrollspy
          effect runs once LessonContent has assigned the heading ids. */}
      <aside className="hidden pr-6 xl:block">
        <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain py-8">
          <TableOfContents items={toc} />
        </div>
      </aside>
    </div>
  );
}

function LessonSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-slate-200/70 dark:bg-white/5"
          style={{ width: `${70 + ((i * 7) % 30)}%` }}
        />
      ))}
      <div className="h-40 rounded-xl bg-slate-200/70 dark:bg-white/5" />
    </div>
  );
}

function LessonError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="glass rounded-2xl p-6 text-center">
      <p className="mb-1 text-2xl">😕</p>
      <p className="mb-1 text-sm font-semibold text-ink-900 dark:text-white">
        Couldn’t load this lesson
      </p>
      <p className="mb-4 text-xs text-slate-400">{message}</p>
      <button onClick={onRetry} className="btn-primary mx-auto">
        Retry
      </button>
    </div>
  );
}
