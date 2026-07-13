import { Link, Navigate, useParams } from "react-router-dom";
import { PRO_TOPICS, getTopic } from "../lib/proTopics";
import {
  FLAT_SECTIONS,
  flatIndex,
  getSection,
  getSections,
} from "./pro/registry";
import { ProShell } from "../components/ProShell";
import { ArrowLeft, ArrowRight } from "../components/Icons";

/** One section of one topic — its own page. */
export function ProSectionPage() {
  const { topic: topicId, section: sectionId } = useParams();
  const topic = getTopic(topicId);
  const section = getSection(topicId, sectionId);

  if (!topic) return <Navigate to={`/pro/${PRO_TOPICS[0].id}`} replace />;
  if (!section) return <Navigate to={`/pro/${topic.id}`} replace />;

  const siblings = getSections(topic.id);
  const pos = siblings.findIndex((s) => s.id === section.id);
  const flat = flatIndex(topic.id, section.id);
  const prev = FLAT_SECTIONS[flat - 1];
  const next = FLAT_SECTIONS[flat + 1];
  const { Content } = section;

  return (
    <ProShell
      activeTopicId={topic.id}
      activeSectionId={section.id}
      scanKey={`${topic.id}/${section.id}`}
    >
      {/* breadcrumb */}
      <nav className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
        <Link to={`/pro/${topic.id}`} className="hover:text-brand-400">
          {topic.icon} {topic.title}
        </Link>
        <span>/</span>
        <span className="text-brand-400">
          {String(pos + 1).padStart(2, "0")} of{" "}
          {String(siblings.length).padStart(2, "0")}
        </span>
      </nav>

      <header className="relative mb-10 overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-brand-500/10 via-transparent to-accent-500/10 p-6 dark:border-white/10 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -top-20 h-52 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(88,132,255,0.2),transparent)]"
        />
        <div className="relative flex items-start gap-4 sm:gap-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-slate-200/80 bg-white/70 text-2xl shadow-card dark:border-white/10 dark:bg-white/[0.04]">
            {section.icon}
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
              {topic.title} · {section.minutes} min read
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-[2.25rem] sm:leading-[1.15]">
              {section.title}
            </h1>
          </div>
        </div>
        <p className="relative mt-4 max-w-2xl text-[14.5px] leading-relaxed text-slate-500 dark:text-slate-400">
          {section.kicker}
        </p>
      </header>

      <div className="space-y-10">
        <Content />
      </div>

      <footer className="mt-16 grid gap-3 border-t border-slate-200/70 pt-8 dark:border-white/10 sm:grid-cols-2">
        {prev ? (
          <Link
            to={`/pro/${prev.topic.id}/${prev.section.id}`}
            className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/50 px-4 py-3 transition hover:border-brand-400/40 dark:border-white/10 dark:bg-white/[0.02]"
          >
            <ArrowLeft
              width={18}
              height={18}
              className="shrink-0 text-slate-400 transition group-hover:-translate-x-0.5 group-hover:text-brand-400"
            />
            <span className="min-w-0">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                {prev.topic.icon} {prev.topic.title}
              </span>
              <span className="block truncate text-sm font-semibold text-ink-900 dark:text-white">
                {prev.section.title}
              </span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            to={`/pro/${next.topic.id}/${next.section.id}`}
            className="group flex items-center justify-end gap-3 rounded-xl border border-slate-200/80 bg-white/50 px-4 py-3 text-right transition hover:border-brand-400/40 dark:border-white/10 dark:bg-white/[0.02] sm:col-start-2"
          >
            <span className="min-w-0">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                {next.topic.icon} {next.topic.title}
              </span>
              <span className="block truncate text-sm font-semibold text-ink-900 dark:text-white">
                {next.section.title}
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
