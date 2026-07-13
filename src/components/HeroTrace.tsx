import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/**
 * The page's signature: a live APM-style "waterfall" of one HTTP request
 * flowing through the layers this course teaches. Each hop's bar is sized by
 * its duration and offset by when it starts — so you literally watch the
 * request spend its 70ms. Every row links to the stage that explains it.
 */
interface Hop {
  layer: string;
  detail: string;
  ms: number;
  to: string;
  dot: string; // node colour
  bar: string; // bar gradient
}

const HOPS: Hop[] = [
  {
    layer: "client",
    detail: "GET /orders",
    ms: 0.4,
    to: "client-server-model",
    dot: "bg-brand-400",
    bar: "from-brand-500 to-brand-400",
  },
  {
    layer: "http",
    detail: "TLS · route",
    ms: 2,
    to: "http-and-https",
    dot: "bg-brand-300",
    bar: "from-brand-400 to-brand-300",
  },
  {
    layer: "server",
    detail: "auth · handler",
    ms: 40,
    to: "what-is-a-server",
    dot: "bg-signal-400",
    bar: "from-signal-500 to-signal-400",
  },
  {
    layer: "database",
    detail: "SELECT … JOIN",
    ms: 28,
    to: "queries-and-joins",
    dot: "bg-accent-400",
    bar: "from-accent-500 to-accent-400",
  },
];

const TOTAL = HOPS.reduce((n, h) => n + h.ms, 0);

// cumulative start offset for each hop (sequential waterfall)
const OFFSETS = HOPS.reduce<number[]>((acc, _hop, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + HOPS[i - 1].ms);
  return acc;
}, []);

export function HeroTrace() {
  const [run, setRun] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setRun(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="relative">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 bg-[radial-gradient(55%_55%_at_65%_35%,rgba(88,132,255,0.22),transparent)]"
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 shadow-[0_30px_80px_-30px_rgba(10,13,22,0.6)] backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/85">
        {/* terminal title bar */}
        <div className="flex items-center gap-2 border-b border-slate-200/70 bg-slate-50/60 px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.02]">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-signal-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent-400/80" />
          <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
            request&nbsp;trace
          </span>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-accent-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-accent-500 ring-1 ring-inset ring-accent-500/20">
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent-400 shadow-[0_0_6px_rgba(56,232,198,0.9)] motion-reduce:animate-none" />
            200 OK
          </span>
        </div>

        <div className="px-4 py-4 sm:px-5">
          {/* column header / ms axis */}
          <div className="mb-2 flex items-center gap-3 pl-[26px] font-mono text-[9px] uppercase tracking-wider text-slate-400/70">
            <span className="w-[92px] sm:w-[104px]">span</span>
            <span className="flex flex-1 justify-between">
              <span>0ms</span>
              <span>{TOTAL}ms</span>
            </span>
            <span className="w-11 text-right">time</span>
          </div>

          <ul className="relative">
            {/* spine connecting the nodes */}
            <div className="pointer-events-none absolute bottom-6 left-[9px] top-3 w-px bg-gradient-to-b from-brand-400/50 via-slate-300/40 to-accent-400/50 dark:via-white/10" />

            {HOPS.map((hop, i) => {
              const left = (OFFSETS[i] / TOTAL) * 100;
              const width = (hop.ms / TOTAL) * 100;
              return (
                <li key={hop.layer}>
                  <Link
                    to={`/lesson/${hop.to}`}
                    className="group flex items-center gap-3 rounded-lg py-2 pr-1 transition hover:bg-slate-100/70 dark:hover:bg-white/[0.03]"
                  >
                    {/* node on the spine */}
                    <span className="relative z-10 grid w-[18px] shrink-0 place-items-center">
                      <span
                        className={`h-[9px] w-[9px] rounded-full ${hop.dot} ring-4 ring-white transition group-hover:scale-125 dark:ring-ink-900`}
                      />
                    </span>

                    {/* layer + detail */}
                    <span className="w-[92px] shrink-0 sm:w-[104px]">
                      <span className="block font-mono text-[13px] font-semibold leading-tight text-ink-900 dark:text-slate-100">
                        {hop.layer}
                      </span>
                      <span className="block truncate font-mono text-[10.5px] leading-tight text-slate-400">
                        {hop.detail}
                      </span>
                    </span>

                    {/* waterfall bar */}
                    <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-200/60 dark:bg-white/[0.06]">
                      <span
                        className={`absolute inset-y-0 rounded-full bg-gradient-to-r ${hop.bar}`}
                        style={{
                          left: `${left}%`,
                          width: run ? `max(${width}%, 6px)` : 0,
                          transition: "width 700ms cubic-bezier(0.22,1,0.36,1)",
                          transitionDelay: `${i * 140}ms`,
                        }}
                      />
                    </span>

                    {/* duration */}
                    <span className="w-11 shrink-0 text-right font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-300">
                      {hop.ms}ms
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* response row */}
          <div className="mt-2 flex items-center gap-3 border-t border-dashed border-slate-200/70 pt-3 dark:border-white/10">
            <span className="grid w-[18px] shrink-0 place-items-center">
              <span className="h-[9px] w-[9px] rounded-full bg-accent-400 shadow-[0_0_12px_1px_rgba(56,232,198,0.8)]" />
            </span>
            <span className="flex-1 font-mono text-[12px] text-accent-500">
              ← 200 · application/json
            </span>
            <span className="font-mono text-[11px] font-semibold tabular-nums text-ink-900 dark:text-white">
              {TOTAL}ms
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center font-mono text-[11px] text-slate-400">
        every lesson is a hop on this path — click one to jump in
      </p>
    </div>
  );
}
