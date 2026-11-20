type ScoreRingProps = {
  score: number
}

export function ScoreRing({ score }: ScoreRingProps) {
  return (
    <div
      role="img"
      aria-label={`Overall freshness score: ${score} out of 100`}
      className="relative mx-auto aspect-square w-44 max-w-full sm:w-48"
    >
      <svg
        viewBox="0 0 120 120"
        aria-hidden="true"
        className="h-full w-full overflow-visible"
      >
        <defs>
          <linearGradient id="score-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--ts-indigo)" />
            <stop offset="100%" stopColor="var(--ts-cyan)" />
          </linearGradient>
        </defs>
        <circle
          cx="60"
          cy="60"
          r="48"
          pathLength="100"
          fill="none"
          stroke="var(--ts-track)"
          strokeWidth="8"
        />
        <circle
          className="score-ring__progress"
          cx="60"
          cy="60"
          r="48"
          pathLength="100"
          fill="none"
          stroke="url(#score-ring-gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDashoffset={100 - score}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center font-bold tracking-tight text-slate-950">
        <span className="text-3xl">{score}</span>
        <span className="text-sm font-semibold text-slate-600">/ 100</span>
      </span>
    </div>
  )
}
