import { useMemo } from "react";
import {
  LANG_LABELS,
  usePreferences,
  type LangKey,
} from "../providers/PreferencesProvider";
import type { CodeSnippet } from "../lib/markdownSegments";
import { HighlightedCode } from "./HighlightedCode";
import { CopyButton } from "./CopyButton";

/** Multi-language code example. The active tab follows the global preference. */
export function CodeTabs({ snippets }: { snippets: CodeSnippet[] }) {
  const { lang, setLang } = usePreferences();

  const available = useMemo(() => snippets.map((s) => s.lang), [snippets]);
  const active: LangKey = available.includes(lang) ? lang : available[0];
  const activeSnippet =
    snippets.find((s) => s.lang === active) ?? snippets[0];

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-slate-200/70 bg-ink-900 shadow-card dark:border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] pr-2">
        <div className="flex">
          {snippets.map((s) => {
            const isActive = s.lang === active;
            return (
              <button
                key={s.lang}
                onClick={() => setLang(s.lang)}
                className={`relative px-3.5 py-2 text-xs font-medium transition ${
                  isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {LANG_LABELS[s.lang]}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-400 to-accent-400" />
                )}
              </button>
            );
          })}
        </div>
        <CopyButton text={activeSnippet.code} />
      </div>
      <div className="overflow-x-auto">
        <HighlightedCode code={activeSnippet.code} lang={active} />
      </div>
    </div>
  );
}
