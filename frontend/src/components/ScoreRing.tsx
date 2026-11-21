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
        <circle
          cx="60"
          cy="60"
          r="48"
          pathLength="100"
          fill="none"
          stroke="rgb(255 255 255 / 0.3)"
          strokeWidth="8"
        />
        <circle
          className="score-ring__progress"
          cx="60"
          cy="60"
          r="48"
          pathLength="100"
          fill="none"
          stroke="var(--ts-blue)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDashoffset={100 - score}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span className="score-ring__label absolute inset-0 flex flex-col items-center justify-center font-bold tracking-tight">
        <span className="text-3xl">{score}</span>
        <span className="text-sm font-semibold text-white">/ 100</span>
      </span>
    </div>
  )
}
