import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PRO_TOPICS } from "../lib/proTopics";
import { ChevronDown, SparkIcon } from "./Icons";

/**
 * The eight reference topics, straight from the header — every one of them is
 * a page, so this menu is the shortest path to any of them from anywhere.
 */
export function ProMenu() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const onPro = pathname.startsWith("/pro");

  // close on navigation
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition ${
          onPro || open
            ? "border-brand-400/50 bg-brand-500/10 text-brand-500 dark:text-brand-300"
            : "border-slate-200/80 text-ink-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
        }`}
      >
        <SparkIcon width={15} height={15} />
        <span className="hidden sm:inline">Pro Shelf</span>
        <ChevronDown
          width={13}
          height={13}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(92vw,600px)] origin-top-left animate-[floatIn_.18s_ease-out] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-ink-900">
          <div className="border-b border-slate-200/70 bg-gradient-to-r from-brand-500/[0.08] to-accent-500/[0.08] px-4 py-3 dark:border-white/10">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
              Pro Shelf
            </p>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              Eight references — the things senior backend engineers are just
              expected to know.
            </p>
          </div>

          <nav aria-label="Pro Shelf menu">
            <ul className="grid gap-0.5 p-2 sm:grid-cols-2">
              {PRO_TOPICS.map((t) => {
                const isActive = pathname === `/pro/${t.id}`;
                return (
                  <li key={t.id}>
                    <Link
                      to={`/pro/${t.id}`}
                      className={`flex items-start gap-3 rounded-xl p-2.5 transition ${
                        isActive
                          ? "bg-brand-500/10"
                          : "hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200/80 bg-white text-[17px] dark:border-white/10 dark:bg-white/[0.04]">
                        {t.icon}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block truncate text-[13.5px] font-semibold ${
                            isActive
                              ? "text-brand-600 dark:text-brand-300"
                              : "text-ink-900 dark:text-white"
                          }`}
                        >
                          {t.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[11.5px] text-slate-400">
                          {t.kicker}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
