import type { ReactNode } from "react";
import { slugify } from "../lib/toc";
import { CheckIcon, CloseIcon, ExternalLink } from "./Icons";

/** Shared building blocks for the Pro Shelf topic pages. */

/**
 * One section of a topic.
 *
 * `data-pro-section` is what the page reads back out of the DOM to build the
 * left nav and the "On this page" rail — so a section only has to be written
 * once, here, and both rails follow it automatically.
 */
export function Block({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={slugify(title)}
      data-pro-section={title}
      className="scroll-mt-28"
    >
      <h2 className="mb-3 font-display text-lg font-bold tracking-tight text-ink-900 dark:text-white">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function RefTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/70 dark:border-white/[0.08]">
      <table className="w-full border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="bg-slate-50/80 dark:bg-white/[0.03]">
            {head.map((h, i) => (
              <th
                key={h}
                className={`whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400 ${
                  i > 0
                    ? "border-l border-slate-200/70 dark:border-white/[0.06]"
                    : ""
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr
              key={ri}
              className="border-t border-slate-200/70 dark:border-white/[0.06]"
            >
              {r.map((c, ci) => (
                <td
                  key={ci}
                  className={`px-4 py-2.5 align-top ${
                    ci === 0
                      ? "text-slate-600 dark:text-slate-300"
                      : "font-medium text-ink-900 dark:text-white"
                  } ${ci > 0 ? "border-l border-slate-200/70 dark:border-white/[0.06]" : ""}`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Rules({
  items,
  numbered,
}: {
  items: ReactNode[];
  numbered?: boolean;
}) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li
          key={i}
          className="flex gap-3 rounded-lg border border-slate-200/60 bg-white/40 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-slate-600 dark:border-white/[0.06] dark:bg-white/[0.015] dark:text-slate-300"
        >
          <span className="mt-0.5 shrink-0 font-mono text-[11px] font-bold text-brand-400">
            {numbered ? `${i + 1}.` : "→"}
          </span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function Ladder({
  steps,
  ordered,
}: {
  steps: [string, string][];
  ordered?: boolean;
}) {
  return (
    <ol className="space-y-2.5">
      {steps.map(([t, d], i) => (
        <li key={i} className="flex items-start gap-3">
          <span
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg font-mono text-[12px] font-bold ${
              ordered
                ? "bg-brand-500/15 text-brand-400"
                : "bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300"
            }`}
          >
            {i + 1}
          </span>
          <div className="pt-0.5">
            <span className="text-[14px] font-medium text-ink-900 dark:text-white">
              {t}
            </span>
            <span className="text-[13px] text-slate-400"> — {d}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function MiniCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/50 p-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
      <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 [&_b]:font-semibold [&_b]:text-ink-900 dark:[&_b]:text-white">
        {children}
      </p>
    </div>
  );
}

export function RedFlags({ items }: { items: string[] }) {
  return (
    <div
      id="red-flags"
      data-pro-section="Red flags"
      className="scroll-mt-28 rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4"
    >
      <p className="mb-2.5 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-red-400">
        <CloseIcon width={12} height={12} /> red flags
      </p>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li
            key={it}
            className="flex gap-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300"
          >
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-red-400" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Numbers({
  items,
  wide,
}: {
  items: [string, string][];
  wide?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/50 p-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
      <p className="mb-3 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <CheckIcon width={12} height={12} className="text-accent-500" /> numbers
        to know
      </p>
      <dl
        className={`grid gap-3 ${wide ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-2"}`}
      >
        {items.map(([n, label]) => (
          <div key={label}>
            <dt className="font-mono text-[15px] font-bold tabular-nums text-ink-900 dark:text-white">
              {n}
            </dt>
            <dd className="mt-0.5 text-[11px] leading-tight text-slate-400">
              {label}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Callout({
  tone,
  title,
  children,
}: {
  tone: "info" | "good" | "warn" | "bad";
  title: string;
  children: ReactNode;
}) {
  const tones = {
    info: "border-brand-400/25 bg-brand-500/[0.06]",
    good: "border-accent-500/25 bg-accent-500/[0.06]",
    warn: "border-signal-400/25 bg-signal-500/[0.06]",
    bad: "border-red-500/25 bg-red-500/[0.05]",
  } as const;
  const dot = {
    info: "bg-brand-400",
    good: "bg-accent-400",
    warn: "bg-signal-400",
    bad: "bg-red-400",
  } as const;
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="mb-1 flex items-center gap-2 text-[13.5px] font-semibold text-ink-900 dark:text-white">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot[tone]}`} />
        {title}
      </p>
      <div className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 [&_b]:font-semibold [&_b]:text-ink-900 dark:[&_b]:text-white [&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] dark:[&_code]:bg-white/10">
        {children}
      </div>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400 [&_b]:font-semibold [&_b]:text-ink-900 dark:[&_b]:text-white [&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] dark:[&_code]:bg-white/10">
      {children}
    </p>
  );
}

/** A small code sample, styled like the lesson code blocks. */
export function Snippet({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-ink-900 dark:border-white/10">
      <div className="border-b border-white/10 bg-white/[0.03] px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
          {lang}
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-3">
        <code className="font-mono text-[12.5px] leading-relaxed text-slate-300">
          {code}
        </code>
      </pre>
    </div>
  );
}

/** Where to go next — the primary sources worth an hour of your time. */
export function Learn({
  links,
}: {
  links: { label: string; href: string; note: string }[];
}) {
  return (
    <section
      id="learn-more"
      data-pro-section="Learn more"
      className="scroll-mt-28 rounded-2xl border border-brand-400/20 bg-brand-500/[0.04] p-5"
    >
      <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-400">
        learn more
      </p>
      <ul className="space-y-1.5">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex items-start gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-white/60 dark:hover:bg-white/5"
            >
              <ExternalLink
                width={13}
                height={13}
                className="mt-1 shrink-0 text-slate-400 transition group-hover:text-brand-400"
              />
              <span className="min-w-0">
                <span className="block text-[13.5px] font-medium text-ink-900 group-hover:text-brand-500 dark:text-white dark:group-hover:text-brand-300">
                  {l.label}
                </span>
                <span className="block text-[12px] leading-snug text-slate-400">
                  {l.note}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * A single, spotlighted external resource — a premium CTA banner for the one
 * link worth sending the reader to right now.
 */
export function FeaturedLink({
  eyebrow = "Featured · go deeper",
  emoji = "🚀",
  title,
  note,
  href,
}: {
  eyebrow?: string;
  emoji?: string;
  title: string;
  note: string;
  href: string;
}) {
  const host = href.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-brand-400/30 bg-gradient-to-br from-brand-500/[0.14] via-brand-500/[0.03] to-accent-500/[0.12] p-4 transition hover:-translate-y-0.5 hover:border-brand-400/60 hover:shadow-glow sm:p-5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-brand-500/20 blur-2xl transition group-hover:bg-brand-500/30"
      />
      <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-brand-400/30 bg-white/70 text-2xl shadow-card dark:bg-white/[0.06]">
        {emoji}
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-400">
          {eyebrow}
        </span>
        <span className="mt-1 block text-[15px] font-bold tracking-tight text-ink-900 dark:text-white">
          {title}
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-slate-500 dark:text-slate-400">
          {note}{" "}
          <span className="whitespace-nowrap font-medium text-brand-500 dark:text-brand-300">
            {host}
          </span>
        </span>
      </span>
      <span className="relative hidden shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 px-3.5 py-2 text-[13px] font-semibold text-white shadow-glow transition group-hover:gap-2.5 sm:flex">
        Visit
        <ExternalLink width={14} height={14} />
      </span>
      <ExternalLink
        width={18}
        height={18}
        className="relative shrink-0 text-brand-400 sm:hidden"
      />
    </a>
  );
}

/** Two-column "do this / not that" comparison. */
export function VS({
  good,
  bad,
}: {
  good: { title: string; body: ReactNode };
  bad: { title: string; body: ReactNode };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-accent-500/25 bg-accent-500/[0.06] p-4">
        <p className="mb-1 text-[13.5px] font-semibold text-accent-600 dark:text-accent-400">
          ✅ {good.title}
        </p>
        <div className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
          {good.body}
        </div>
      </div>
      <div className="rounded-xl border border-red-500/25 bg-red-500/[0.05] p-4">
        <p className="mb-1 text-[13.5px] font-semibold text-red-500 dark:text-red-400">
          ❌ {bad.title}
        </p>
        <div className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
          {bad.body}
        </div>
      </div>
    </div>
  );
}
