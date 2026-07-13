import { useState } from "react";
import { CheckIcon, CopyIcon } from "./Icons";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
      aria-label="Copy code"
    >
      {copied ? (
        <>
          <CheckIcon width={14} height={14} className="text-accent-400" />
          <span className="text-accent-400">Copied</span>
        </>
      ) : (
        <>
          <CopyIcon width={14} height={14} />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
