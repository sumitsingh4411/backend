import { Link } from "react-router-dom";
import { PRO_TOPICS } from "../lib/proTopics";
import { getSections } from "../pages/pro/registry";
import { ArrowLeft, ChevronDown } from "./Icons";

/**
 * Left docs pane for the Pro Shelf: the eight topics, with the one you're in
 * opened out into its pages. Same flush-pane treatment as the lesson sidebar —
 * a divider, not a card.
 */
export function ProSidebar({
  activeTopicId,
  activeSectionId,
  onNavigate,
}: {
  activeTopicId: string;
  activeSectionId?: string;
  onNavigate?: () => void;
}) {
  return (
    // min-h-0 lets the scroll area actually shrink inside the flex column
    <nav className="flex h-full min-h-0 flex-col" aria-label="Pro Shelf topics">
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
          Back to roadmap
        </Link>

        <p className="mt-4 font-display text-[15px] font-bold tracking-tight text-ink-900 dark:text-white">
          Pro Shelf
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-slate-400">
          The reference you keep open at work.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-10">
        <ul className="space-y-0.5">
          {PRO_TOPICS.map((t) => {
            const isActive = t.id === activeTopicId;
            const sections = getSections(t.id);
            return (
              <li key={t.id}>
                <Link
                  to={`/pro/${t.id}`}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] transition ${
                    isActive
                      ? "bg-brand-500/10 font-semibold text-brand-600 dark:text-brand-300"
                      : "text-slate-600 hover:bg-slate-100 hover:text-ink-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                  }`}
                >
                  <span className="text-[15px] leading-none">{t.icon}</span>
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  <ChevronDown
                    width={13}
                    height={13}
                    className={`shrink-0 text-slate-400 transition-transform ${
                      isActive ? "" : "-rotate-90"
                    }`}
                  />
                </Link>

                {/* the topic you're in opens into its pages */}
                {isActive && (
                  <ul className="ml-4 mt-1 space-y-px border-l border-slate-200 pb-2 dark:border-white/10">
                    {sections.map((s) => {
                      const on = s.id === activeSectionId;
                      return (
                        <li key={s.id}>
                          <Link
                            to={`/pro/${t.id}/${s.id}`}
                            onClick={onNavigate}
                            className={`-ml-px flex items-center gap-2 border-l-2 py-1.5 pl-3.5 pr-2 text-[12.5px] leading-snug transition ${
                              on
                                ? "border-brand-400 font-medium text-brand-600 dark:text-brand-300"
                                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-ink-900 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white"
                            }`}
                          >
                            <span className="min-w-0 flex-1">{s.title}</span>
                            <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-400">
                              {s.minutes}m
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
