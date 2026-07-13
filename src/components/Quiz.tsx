import { useState } from "react";
import type { QuizQuestion } from "../types";
import { CheckIcon, CloseIcon, SparkIcon } from "./Icons";

export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  return (
    <section className="mt-12">
      <div className="mb-5 flex items-center gap-2">
        <SparkIcon width={18} height={18} className="text-accent-400" />
        <h2 className="text-lg font-bold text-ink-900 dark:text-white">
          Check your understanding
        </h2>
      </div>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <QuizItem key={i} q={q} index={i} />
        ))}
      </div>
    </section>
  );
}

function QuizItem({ q, index }: { q: QuizQuestion; index: number }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === q.answer;

  return (
    <div className="glass rounded-2xl p-5">
      <p className="mb-3 flex gap-2 text-sm font-semibold text-ink-900 dark:text-white">
        <span className="font-mono text-brand-400">Q{index + 1}.</span>
        {q.q}
      </p>
      <div className="grid gap-2">
        {q.options.map((opt, oi) => {
          const isPicked = picked === oi;
          const isAnswer = q.answer === oi;
          let cls =
            "border-slate-200/70 hover:border-brand-400/40 hover:bg-brand-500/[0.05] dark:border-white/10";
          if (answered && isAnswer)
            cls = "border-accent-500/50 bg-accent-500/10";
          else if (answered && isPicked && !isAnswer)
            cls = "border-red-500/50 bg-red-500/10";
          else if (answered) cls = "border-slate-200/60 opacity-60 dark:border-white/10";

          return (
            <button
              key={oi}
              disabled={answered}
              onClick={() => setPicked(oi)}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition ${cls}`}
            >
              <span className="text-slate-700 dark:text-slate-200">{opt}</span>
              {answered && isAnswer && (
                <CheckIcon width={16} height={16} className="text-accent-500" />
              )}
              {answered && isPicked && !isAnswer && (
                <CloseIcon width={16} height={16} className="text-red-400" />
              )}
            </button>
          );
        })}
      </div>
      {answered && (
        <div
          className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
            correct
              ? "border-accent-500/30 bg-accent-500/[0.06] text-accent-600 dark:text-accent-400"
              : "border-brand-400/30 bg-brand-500/[0.06] text-slate-600 dark:text-slate-300"
          }`}
        >
          <span className="font-semibold">
            {correct ? "Correct! " : "Not quite. "}
          </span>
          {q.explain}
          {!correct && (
            <button
              onClick={() => setPicked(null)}
              className="ml-2 font-medium text-brand-400 underline underline-offset-2"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
