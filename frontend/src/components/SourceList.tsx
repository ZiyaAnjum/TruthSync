import type { ClaimReport } from '../../../shared/schemas'

type SourceListProps = {
  claimReport: ClaimReport
}

type Stance = ClaimReport['conflict']['stances'][number]['stance']

const stanceLabels: Record<Stance, string> = {
  supports: 'Supports',
  contradicts: 'Contradicts',
  outdated: 'Outdated',
  unrelated: 'Unrelated',
}

function isHttpUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

function StanceIcon({ stance }: { stance: Stance }) {
  if (stance === 'supports') {
    return (
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="m6.5 10 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (stance === 'contradicts') {
    return (
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="m7 7 6 6m0-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  if (stance === 'outdated') {
    return (
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="M10 5.5V10l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" />
      <path d="M6 10h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function SourceList({ claimReport }: SourceListProps) {
  return (
    <section
      aria-labelledby="sources-heading"
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 id="sources-heading" className="text-xl font-bold text-slate-950">
        Sources
      </h2>
      {claimReport.evidence.length === 0 ? (
        <p className="mt-4 text-sm text-slate-700">
          No sources were retrieved for this claim.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {claimReport.evidence.map((evidence, index) => {
            const stance = claimReport.conflict.stances.find(
              (item) => item.url === evidence.url,
            )

            return (
              <li
                key={`${evidence.claim_id}-${index}`}
                className="min-w-0 rounded-xl border border-slate-200 p-4"
              >
                <p className="break-words text-base font-semibold leading-6 text-slate-950">
                  {isHttpUrl(evidence.url) ? (
                    <a
                      href={evidence.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-blue-900 underline decoration-2 underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
                    >
                      {evidence.title}
                    </a>
                  ) : (
                    <>
                      {evidence.title}
                      <span className="ml-1 break-all font-normal text-slate-700">
                        ({evidence.url})
                      </span>
                    </>
                  )}
                </p>
                <p className="mt-2 break-words text-sm text-slate-800">
                  <span className="font-semibold">Source date:</span>{' '}
                  {evidence.published_date ?? 'undated'}
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-slate-800">
                  {evidence.snippet}
                </p>
                {stance && (
                  <div className="mt-4 border-t border-slate-200 pt-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <StanceIcon stance={stance.stance} />
                      <span>{stanceLabels[stance.stance]}</span>
                    </p>
                    <p className="mt-2 break-words text-sm leading-6 text-slate-800">
                      “{stance.quote}”
                    </p>
                    <p className="mt-2 break-words text-sm leading-6 text-slate-800">
                      {stance.reason}
                    </p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
