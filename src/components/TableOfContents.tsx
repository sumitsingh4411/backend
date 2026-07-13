import type { TocItem } from "../lib/toc";
import { useScrollSpy } from "../lib/useScrollSpy";

/**
 * "On this page" — the headings of whatever you're reading, with the section
 * you're currently in highlighted.
 */
export function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useScrollSpy(items);

  if (items.length < 2) return null;

  return (
    <nav aria-label="On this page">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-slate-400">
        On this page
      </p>

      <ul className="border-l border-slate-200 dark:border-white/10">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={() => setActive(item.id)}
                className={`-ml-px block border-l-2 py-1.5 text-[13px] leading-snug transition ${
                  item.level === 3 ? "pl-6" : "pl-4"
                } ${
                  isActive
                    ? "border-brand-400 font-medium text-brand-600 dark:text-brand-300"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-ink-900 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white"
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
