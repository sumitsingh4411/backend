import { Link, NavLink } from "react-router-dom";
import { useRoadmap } from "../providers/RoadmapProvider";
import { useProgress } from "../providers/ProgressProvider";
import { PRO_TOPICS } from "../lib/proTopics";
import { LogoMark, SearchIcon, TreeIcon } from "./Icons";
import { ProMenu } from "./ProMenu";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { totalLessons } = useRoadmap();
  const { count } = useProgress();
  const pct = totalLessons ? count / totalLessons : 0;

  return (
    <header className="sticky top-0 z-40">
      <div className="glass relative border-x-0 border-t-0">
        {/* everything lives on ONE row: brand · Roadmap · the eight topics · utilities */}
        <div className="flex h-16 w-full items-stretch gap-2 px-4 sm:gap-3 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <LogoMark />
            <div className="leading-tight">
              <span className="block font-display text-[15px] font-bold tracking-tight text-ink-900 dark:text-white">
                Backend<span className="gradient-text">Path</span>
              </span>
              <span className="hidden font-mono text-[10px] uppercase tracking-widest text-slate-400 sm:block">
                beginner → pro
              </span>
            </div>
          </Link>

          <div className="flex shrink-0 items-center">
            <NavLink
              to="/roadmap"
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition ${
                  isActive
                    ? "border-brand-400/50 bg-brand-500/10 text-brand-500 dark:text-brand-300"
                    : "border-slate-200/80 text-ink-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                }`
              }
            >
              <TreeIcon width={15} height={15} />
              <span className="hidden sm:inline">Roadmap</span>
            </NavLink>
          </div>

          {/* divider between the roadmap and the reference topics */}
          <span
            aria-hidden
            className="hidden w-px shrink-0 self-center bg-slate-200/70 dark:bg-white/10 md:block"
            style={{ height: "1.5rem" }}
          />

          {/* the eight Pro topics — the header's primary navigation, on this row */}
          <nav
            aria-label="Pro Shelf"
            className="hidden min-w-0 flex-1 items-stretch gap-0.5 overflow-x-auto md:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {PRO_TOPICS.map((t) => (
              <NavLink
                key={t.id}
                to={`/pro/${t.id}`}
                title={t.title}
                className={({ isActive }) =>
                  `group relative flex h-full shrink-0 items-center gap-1.5 px-2 text-[13px] font-medium transition-colors ${
                    isActive
                      ? "text-ink-900 dark:text-white"
                      : "text-slate-500 hover:text-ink-900 dark:text-slate-400 dark:hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* hover backdrop */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0.5 inset-y-2.5 rounded-lg transition group-hover:bg-slate-500/[0.06] dark:group-hover:bg-white/[0.05]"
                    />
                    {/* icon tile — lights up when active */}
                    <span
                      className={`relative grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[13px] leading-none transition ${
                        isActive
                          ? "bg-gradient-to-br from-brand-500/30 to-accent-500/25 shadow-[0_0_16px_-3px_rgba(88,132,255,0.55)] ring-1 ring-inset ring-brand-400/30"
                          : "bg-slate-100 group-hover:bg-white dark:bg-white/[0.06] dark:group-hover:bg-white/10"
                      }`}
                    >
                      {t.icon}
                    </span>
                    <span className="relative whitespace-nowrap">
                      {t.short}
                    </span>
                    {/* animated gradient underline, pinned to the bottom of the bar */}
                    <span
                      aria-hidden
                      className={`absolute inset-x-2.5 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-brand-400 to-accent-400 transition-all duration-300 ${
                        isActive
                          ? "opacity-100 shadow-[0_0_10px_rgba(88,132,255,0.6)]"
                          : "scale-x-0 opacity-0 group-hover:scale-x-50 group-hover:opacity-40"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* on narrow screens the topics collapse into a dropdown, in the same spot */}
          <div className="flex flex-1 items-center md:hidden">
            <ProMenu />
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <button
              onClick={onOpenSearch}
              className="hidden items-center gap-2 rounded-lg border border-slate-200/80 px-3 py-2 text-xs text-slate-400 transition hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5 2xl:flex"
            >
              <SearchIcon width={15} height={15} />
              <span>Search</span>
              <kbd className="rounded border border-slate-300/70 px-1.5 py-0.5 font-mono text-[10px] dark:border-white/15">
                ⌘K
              </kbd>
            </button>
            <button
              onClick={onOpenSearch}
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200/80 text-slate-400 transition hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5 2xl:hidden"
              aria-label="Search"
            >
              <SearchIcon width={17} height={17} />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* top progress bar */}
        <div className="h-0.5 w-full bg-transparent">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-accent-400 transition-[width] duration-500"
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      </div>
    </header>
  );
}
