import type { ClaimReport, Correction } from '../../../shared/schemas'

type RealityReconstructionProps = {
  claimReport: ClaimReport
  correction: Correction | null
}

function isHttpUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

function SourceLink({ url }: { url: string }) {
  if (!isHttpUrl(url)) {
    return <span className="break-all">{url}</span>
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-blue-900 underline decoration-2 underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
    >
      {url}
    </a>
  )
}

function stanceLabel(stance: string): { icon: string; label: string } | null {
  if (stance === 'supports') return { icon: '✓', label: 'Supports' }
  if (stance === 'contradicts') return { icon: '×', label: 'Contradicts' }
  if (stance === 'outdated') return { icon: '↻', label: 'Outdated' }
  return null
}

export function RealityReconstruction({
  claimReport,
  correction,
}: RealityReconstructionProps) {
  const datedEvidence = claimReport.evidence
    .filter((evidence) => evidence.published_date !== null)
    .sort((left, right) =>
      (left.published_date ?? '').localeCompare(right.published_date ?? ''),
    )
  const undatedCount = claimReport.evidence.filter(
    (evidence) => evidence.published_date === null,
  ).length
  const datedStances = datedEvidence.flatMap((evidence) => {
    const stance = claimReport.conflict.stances.find(
      (item) => item.url === evidence.url,
    )
    const display = stance ? stanceLabel(stance.stance) : null
    if (!stance || !display) return []

    return [{ evidence, stance, display }]
  })
  const correctionChange = correction?.changes.find(
    (change) => change.claim_id === claimReport.claim.id,
  )
  const newestSupportingEvidence = claimReport.conflict.newest_supporting_date
    ? claimReport.evidence.find(
        (evidence) =>
          evidence.published_date === claimReport.conflict.newest_supporting_date &&
          claimReport.conflict.stances.some(
            (stance) => stance.url === evidence.url && stance.stance === 'supports',
          ),
      )
    : undefined

  return (
    <section
      aria-labelledby="reality-reconstruction-heading"
      className="reality-card min-w-0 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="reality-reconstruction-heading"
          className="text-xl font-bold text-white"
        >
          Reality Reconstruction
        </h2>
        <span className="reality-flag">FLAGSHIP</span>
      </div>
      <p className="reality-card__note mt-2 text-sm leading-6">
        Built from this report&apos;s dated evidence. Nothing here is generated or guessed.
      </p>
      <ol className="reality-strip mt-5" aria-label="Reality reconstruction stages">
        <li>Before</li>
        <li aria-hidden="true">→</li>
        <li>Changed</li>
        <li aria-hidden="true">→</li>
        <li>Today</li>
      </ol>

      {datedEvidence.length === 0 ? (
        <div className="reality-card__content mt-4 space-y-2 text-sm leading-6">
          <p>Not enough dated evidence to reconstruct how this fact changed.</p>
          {undatedCount > 0 && (
            <p>
              {undatedCount}{' '}
              {undatedCount === 1
                ? 'source has no date and is not used.'
                : 'sources have no date and are not used.'}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <section aria-labelledby="reconstruction-before-heading" className="reality-card__content min-w-0">
            <h3
              id="reconstruction-before-heading"
              className="text-base font-bold text-white"
            >
              Before: what the AI answer said
            </h3>
            <p className="mt-2 break-words text-sm leading-6">
              {claimReport.claim.original_sentence}
            </p>
            <p className="mt-2 break-words text-sm leading-6">
              <span className="font-semibold">Claim checked:</span>{' '}
              {claimReport.claim.text}
            </p>
          </section>

          <section aria-labelledby="reconstruction-changed-heading" className="reality-card__content min-w-0">
            <h3
              id="reconstruction-changed-heading"
              className="text-base font-bold text-white"
            >
              Changed: what the dated sources show
            </h3>
            <ol className="mt-3 space-y-3">
              {datedStances.map(({ evidence, stance, display }, index) => (
                  <li
                    key={`${evidence.url}-${evidence.published_date}-${index}`}
                    className="premium-inner min-w-0 p-4"
                  >
                    <p className="text-sm font-semibold text-white">
                      <time dateTime={evidence.published_date ?? undefined}>
                        {evidence.published_date}
                      </time>
                    </p>
                    <p className="mt-2 flex min-w-0 items-start gap-2 text-sm leading-6">
                      <span aria-hidden="true" className="shrink-0 font-bold">
                        {display.icon}
                      </span>
                      <span className="font-semibold">{display.label}</span>
                    </p>
                    <blockquote className="mt-2 break-words text-sm leading-6">
                      &ldquo;{stance.quote}&rdquo;
                    </blockquote>
                    <p className="mt-2 break-words text-sm leading-6">
                      {stance.reason}
                    </p>
                    <p className="mt-2 break-words text-sm leading-6">
                      <span className="font-semibold">Source:</span>{' '}
                      <SourceLink url={evidence.url} />
                    </p>
                  </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="reconstruction-today-heading" className="reality-card__content min-w-0">
            <h3
              id="reconstruction-today-heading"
              className="text-base font-bold text-white"
            >
              Today: what holds now
            </h3>
            {correctionChange ? (
              <div className="mt-2 space-y-2 text-sm leading-6">
                <p className="font-semibold">Corrected value</p>
                <p className="break-words">
                  <span>{correctionChange.original_span}</span>
                  <span aria-label="changes to" className="mx-2 font-semibold">
                    →
                  </span>
                  <span>{correctionChange.new_span}</span>
                </p>
                <p className="break-words">
                  <span className="font-semibold">Source:</span>{' '}
                  <SourceLink url={correctionChange.source_url} />
                </p>
              </div>
            ) : claimReport.conflict.verdict === 'current' ? (
              <p className="mt-2 break-words text-sm leading-6">
                Supported by the newest source dated{' '}
                {claimReport.conflict.newest_supporting_date ? (
                  <time dateTime={claimReport.conflict.newest_supporting_date}>
                    {claimReport.conflict.newest_supporting_date}
                  </time>
                ) : (
                  <span className="font-semibold">date unavailable</span>
                )}
                {newestSupportingEvidence && (
                  <>
                    {' '}
                    <span className="font-semibold">Source:</span>{' '}
                    <SourceLink url={newestSupportingEvidence.url} />
                  </>
                )}
              </p>
            ) : (
              <p className="mt-2 text-sm leading-6">
                No verified current value: evidence is conflicting or insufficient.
              </p>
            )}
          </section>
          {undatedCount > 0 && (
            <p className="reality-card__note text-sm leading-6">
              {undatedCount}{' '}
              {undatedCount === 1
                ? 'source has no date and is not used.'
                : 'sources have no date and are not used.'}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
