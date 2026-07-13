interface Props {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  label?: string;
}

export function ProgressRing({ value, size = 44, stroke = 4, label }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const offset = c * (1 - pct);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="url(#ring-grad)"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5a84ff" />
            <stop offset="1" stopColor="#38e8c6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-[11px] font-semibold text-ink-900 dark:text-white">
        {label ?? `${Math.round(pct * 100)}%`}
      </span>
    </div>
  );
}
