import type { ContentError } from "../lib/contentClient";
import { LogoMark } from "./Icons";

export function LoadingScreen() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse">
          <LogoMark width={40} height={40} />
        </div>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-transparent via-brand-400 to-transparent bg-[length:200%_100%]" />
        </div>
        <p className="font-mono text-xs text-slate-400">Loading roadmap…</p>
      </div>
    </div>
  );
}

export function ErrorScreen({
  error,
  onRetry,
}: {
  error: ContentError;
  onRetry: () => void;
}) {
  const hint =
    error.kind === "rate-limit"
      ? "GitHub's rate limit was hit. Try again shortly, or set source to \"local\" in src/config.ts."
      : error.kind === "not-found"
        ? "The content wasn't found. Check the repo/branch/basePath in src/config.ts."
        : error.kind === "parse"
          ? "The roadmap manifest couldn't be parsed."
          : "Check your internet connection and try again.";

  return (
    <div className="grid min-h-[60vh] place-items-center px-6">
      <div className="glass max-w-md rounded-2xl p-8 text-center shadow-card">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-2xl">
          ⚠️
        </div>
        <h2 className="mb-1 text-lg font-semibold text-ink-900 dark:text-white">
          Couldn’t load the roadmap
        </h2>
        <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
          {error.message}
        </p>
        <p className="mb-5 text-xs text-slate-400">{hint}</p>
        <button onClick={onRetry} className="btn-primary mx-auto">
          Try again
        </button>
      </div>
    </div>
  );
}
