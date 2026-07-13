import type { Resource, ResourceType } from "../types";
import { BookIcon, ExternalLink } from "./Icons";

const TYPE_STYLE: Record<ResourceType, { label: string; cls: string }> = {
  docs: { label: "Docs", cls: "bg-brand-500/15 text-brand-300" },
  article: { label: "Article", cls: "bg-accent-500/15 text-accent-400" },
  video: { label: "Video", cls: "bg-red-500/15 text-red-400" },
  book: { label: "Book", cls: "bg-amber-500/15 text-amber-400" },
  spec: { label: "Spec", cls: "bg-slate-500/20 text-slate-400" },
  course: { label: "Course", cls: "bg-purple-500/15 text-purple-400" },
  tool: { label: "Tool", cls: "bg-cyan-500/15 text-cyan-400" },
  interactive: { label: "Interactive", cls: "bg-pink-500/15 text-pink-400" },
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** "Further reading" — curated external links for going deeper. */
export function Resources({ resources }: { resources: Resource[] }) {
  return (
    <section className="mt-12">
      <div className="mb-5 flex items-center gap-2">
        <BookIcon width={18} height={18} className="text-brand-400" />
        <h2 className="text-lg font-bold text-ink-900 dark:text-white">
          Go deeper
        </h2>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {resources.map((r) => {
          const style = TYPE_STYLE[r.type] ?? TYPE_STYLE.article;
          return (
            <li key={r.url}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group glass flex h-full flex-col gap-1.5 rounded-xl p-4 transition hover:border-brand-400/40 hover:bg-brand-500/[0.05]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold leading-snug text-ink-900 group-hover:text-brand-500 dark:text-slate-200 dark:group-hover:text-brand-300">
                    {r.title}
                  </span>
                  <ExternalLink
                    width={14}
                    height={14}
                    className="mt-0.5 shrink-0 text-slate-400 transition group-hover:text-brand-400"
                  />
                </div>

                {r.note && (
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {r.note}
                  </p>
                )}

                <div className="mt-auto flex items-center gap-2 pt-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${style.cls}`}
                  >
                    {style.label}
                  </span>
                  <span className="truncate font-mono text-[10px] text-slate-400">
                    {hostOf(r.url)}
                  </span>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
