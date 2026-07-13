import { Link, Navigate, useParams } from "react-router-dom";
import { PRO_TOPICS, getTopic, topicIndex } from "../lib/proTopics";
import { getSections } from "./pro/registry";
import { ProShell } from "../components/ProShell";
import { ArrowLeft, ArrowRight } from "../components/Icons";

/** A topic's front page: what it covers, and every page inside it. */
export function ProTopicPage() {
  const { topic: id } = useParams();
  const topic = getTopic(id);

  if (!topic) return <Navigate to={`/pro/${PRO_TOPICS[0].id}`} replace />;

  const sections = getSections(topic.id);
  const minutes = sections.reduce((m, s) => m + s.minutes, 0);
  const i = topicIndex(topic.id);
  const prev = PRO_TOPICS[i - 1];
  const next = PRO_TOPICS[i + 1];

  return (
    <ProShell activeTopicId={topic.id} scanKey={topic.id}>
      <header className="relative mb-10 overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-brand-500/10 via-transparent to-accent-500/10 p-6 dark:border-white/10 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -top-20 h-52 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(88,132,255,0.2),transparent)]"
        />
        <div className="relative flex items-start gap-4 sm:gap-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-slate-200/80 bg-white/70 text-2xl shadow-card dark:border-white/10 dark:bg-white/[0.04] sm:h-16 sm:w-16 sm:text-3xl">
            {topic.icon}
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
              Pro Shelf · {topic.n} /{" "}
              {String(PRO_TOPICS.length).padStart(2, "0")}
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
              {topic.title}
            </h1>
            <p className="mt-2 font-mono text-[12.5px] text-brand-400">
              {topic.kicker}
            </p>
          </div>
        </div>
        <p className="relative mt-5 max-w-2xl text-[14.5px] leading-relaxed text-slate-500 dark:text-slate-400">
          {topic.blurb}
        </p>
        <p className="relative mt-4 font-mono text-[11px] uppercase tracking-wider text-slate-400">
          {sections.length} pages · ~{minutes} min
        </p>
      </header>

      {/* every section is its own page */}
      <ol className="space-y-2.5">
        {sections.map((s, si) => (
          <li key={s.id}>
            <Link
              to={`/pro/${topic.id}/${s.id}`}
              className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/60 p-4 transition hover:-translate-y-0.5 hover:border-brand-400/40 hover:shadow-glow dark:border-white/10 dark:bg-white/[0.02]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white text-xl transition group-hover:border-brand-400/40 dark:border-white/10 dark:bg-white/[0.04]">
                {s.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] tabular-nums text-slate-400">
                    {String(si + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] font-semibold text-ink-900 group-hover:text-brand-500 dark:text-white dark:group-hover:text-brand-300">
                    {s.title}
                  </span>
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {s.kicker}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2 pt-1">
                <span className="font-mono text-[11px] tabular-nums text-slate-400">
                  {s.minutes}m
                </span>
                <ArrowRight
                  width={16}
                  height={16}
                  className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-400 dark:text-slate-600"
                />
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {/* prev / next topic */}
      <footer className="mt-14 grid gap-3 border-t border-slate-200/70 pt-8 dark:border-white/10 sm:grid-cols-2">
        {prev ? (
          <Link
            to={`/pro/${prev.id}`}
            className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/50 px-4 py-3 transition hover:border-brand-400/40 dark:border-white/10 dark:bg-white/[0.02]"
          >
            <ArrowLeft
              width={18}
              height={18}
              className="shrink-0 text-slate-400 transition group-hover:-translate-x-0.5 group-hover:text-brand-400"
            />
            <span className="min-w-0">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                Previous topic
              </span>
              <span className="block truncate text-sm font-semibold text-ink-900 dark:text-white">
                {prev.icon} {prev.title}
              </span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            to={`/pro/${next.id}`}
            className="group flex items-center justify-end gap-3 rounded-xl border border-slate-200/80 bg-white/50 px-4 py-3 text-right transition hover:border-brand-400/40 dark:border-white/10 dark:bg-white/[0.02] sm:col-start-2"
          >
            <span className="min-w-0">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                Next topic
              </span>
              <span className="block truncate text-sm font-semibold text-ink-900 dark:text-white">
                {next.icon} {next.title}
              </span>
            </span>
            <ArrowRight
              width={18}
              height={18}
              className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-400"
            />
          </Link>
        )}
      </footer>
    </ProShell>
  );
}
