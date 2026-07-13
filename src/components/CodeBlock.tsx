import { HighlightedCode } from "./HighlightedCode";
import { CopyButton } from "./CopyButton";

const LABEL: Record<string, string> = {
  sql: "SQL",
  bash: "Shell",
  sh: "Shell",
  shell: "Shell",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  http: "HTTP",
  text: "Text",
  ts: "TypeScript",
  typescript: "TypeScript",
};

/** A single fenced code block (non-tabbed languages). */
export function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const label = LABEL[lang.toLowerCase()] ?? lang.toUpperCase();
  return (
    <div className="my-5 overflow-hidden rounded-xl border border-slate-200/70 bg-ink-900 shadow-card dark:border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <CopyButton text={code} />
      </div>
      <div className="overflow-x-auto">
        <HighlightedCode code={code} lang={lang} />
      </div>
    </div>
  );
}
