import { PageLayout } from '../components/PageLayout'
import { RealityReconstruction } from '../components/RealityReconstruction'
import { SourceList } from '../components/SourceList'
import { StatusBadge } from '../components/StatusBadge'
import { TruthPassport } from '../components/TruthPassport'
import { isDemoMode } from '../lib/dataSource'
import { verdictToStatus } from '../lib/status'
import type { ClaimReport, Correction } from '../../../shared/schemas'

type ClaimDetailScreenProps = {
  claimReport: ClaimReport
  correction: Correction | null
  onBack: () => void
}

function isHttpUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

function SourceUrl({ url }: { url: string }) {
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

export function ClaimDetailScreen({
  claimReport,
  correction,
  onBack,
}: ClaimDetailScreenProps) {
  const status = verdictToStatus(
    claimReport.conflict.verdict,
    claimReport.claim.checkable,
  )
  const datedEvidence = claimReport.evidence
    .filter((evidence) => evidence.published_date !== null)
    .sort((left, right) =>
      (left.published_date ?? '').localeCompare(right.published_date ?? ''),
    )

  return (
    <PageLayout step={3}>
      <article className="mx-auto min-w-0 max-w-4xl">
        {isDemoMode && (
          <p className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M10 9v5M10 6v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Demo data (mock)
          </p>
        )}
        <header className="detail-heading mb-6 min-w-0 p-5 sm:p-7">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
            <h1 className="detail-heading__title min-w-0 flex-1 break-words text-2xl font-bold leading-8 sm:text-3xl">
              {claimReport.claim.text}
            </h1>
            <StatusBadge status={status} />
          </div>
          <p className="detail-heading__text mt-3 break-words text-sm leading-6">
            <span className="font-semibold text-white">Original sentence:</span>{' '}
            {claimReport.claim.original_sentence}
          </p>
          <button
            type="button"
            onClick={onBack}
            className="detail-back-button mt-5 rounded-xl border px-4 py-2.5 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          >
            Back to report
          </button>
        </header>

        <div className="detail-sections grid min-w-0 grid-cols-1 gap-6">
          <TruthPassport claimReport={claimReport} />

          <SourceList claimReport={claimReport} />

          <section
            aria-labelledby="conflict-explanation-heading"
            className="premium-card min-w-0 p-5 sm:p-6"
          >
            <h2
              id="conflict-explanation-heading"
              className="text-xl font-bold text-slate-950"
            >
              Conflict explanation
            </h2>
            <p className="mt-4 text-sm font-semibold text-slate-900">
              {claimReport.conflict.conflict_found
                ? 'Sources disagree'
                : 'No conflict found'}
            </p>
            {claimReport.conflict.conflict_found && (
              <ul className="mt-3 space-y-3">
                {claimReport.conflict.stances.map((stance, index) => (
                  <li
                    key={`${stance.url}-${index}`}
                    className="premium-inner min-w-0 p-4"
                  >
                    <p className="break-words text-sm leading-6 text-slate-800">
                      {stance.reason}
                    </p>
                    <p className="mt-2 break-words text-sm text-slate-800">
                      <span className="font-semibold">Source date:</span>{' '}
                      {stance.source_date ?? 'undated'}
                    </p>
                    <p className="mt-2 break-words text-sm text-slate-800">
                      <span className="font-semibold">Source:</span>{' '}
                      <SourceUrl url={stance.url} />
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 break-words text-sm text-slate-800">
              <span className="font-semibold">Newest supporting date:</span>{' '}
              {claimReport.conflict.newest_supporting_date ?? 'none'}
            </p>
          </section>

          <section
            aria-labelledby="truth-timeline-heading"
            className="premium-card min-w-0 p-5 sm:p-6"
          >
            <h2 id="truth-timeline-heading" className="text-xl font-bold text-slate-950">
              Truth Timeline
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              Dated sources, oldest to newest.
            </p>
            {datedEvidence.length < 2 ? (
              <p className="mt-4 text-sm text-slate-800">
                Not enough dated evidence for a timeline
              </p>
            ) : (
              <ol className="timeline-list mt-4 space-y-3 pl-5">
                {datedEvidence.map((evidence, index) => (
                  <li
                    key={`${evidence.claim_id}-${index}`}
                    className="timeline-entry premium-inner min-w-0 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {evidence.published_date}
                    </p>
                    <p className="mt-2 break-words text-sm font-semibold leading-6">
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
                    <p className="mt-2 break-words text-sm leading-6 text-slate-800">
                      {evidence.snippet}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <RealityReconstruction
            claimReport={claimReport}
            correction={correction}
          />
        </div>
      </article>
    </PageLayout>
  )
}
