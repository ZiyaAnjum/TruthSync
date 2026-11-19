import { PageLayout } from '../components/PageLayout'
import { SourceList } from '../components/SourceList'
import { TruthPassport } from '../components/TruthPassport'
import type { ClaimReport } from '../../../shared/schemas'

type ClaimDetailScreenProps = {
  claimReport: ClaimReport
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
  onBack,
}: ClaimDetailScreenProps) {
  const datedEvidence = claimReport.evidence
    .filter((evidence) => evidence.published_date !== null)
    .sort((left, right) =>
      (left.published_date ?? '').localeCompare(right.published_date ?? ''),
    )

  return (
    <PageLayout>
      <article className="mx-auto min-w-0 max-w-4xl">
        <header className="mb-6 min-w-0">
          <h1 className="break-words text-2xl font-bold leading-8 text-slate-950 sm:text-3xl">
            {claimReport.claim.text}
          </h1>
          <p className="mt-3 break-words text-sm leading-6 text-slate-700">
            <span className="font-semibold">Original sentence:</span>{' '}
            {claimReport.claim.original_sentence}
          </p>
        </header>

        <div className="grid min-w-0 grid-cols-1 gap-6">
          <TruthPassport claimReport={claimReport} />

          <SourceList claimReport={claimReport} />

          <section
            aria-labelledby="conflict-explanation-heading"
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
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
                    className="min-w-0 rounded-xl border border-slate-200 p-4"
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
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
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
              <ol className="mt-4 space-y-3">
                {datedEvidence.map((evidence, index) => (
                  <li
                    key={`${evidence.claim_id}-${index}`}
                    className="min-w-0 rounded-xl border border-slate-200 p-4"
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

          <section
            aria-labelledby="reality-reconstruction-heading"
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <h2
              id="reality-reconstruction-heading"
              className="text-xl font-bold text-slate-950"
            >
              Reality Reconstruction
            </h2>
            {/* TEMPORARY. Replace when the schema carries reconstruction text. */}
            <p className="mt-4 break-words text-sm leading-6 text-slate-800">
              Not available yet. This needs data that is not in the shared report format.
            </p>
          </section>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-900 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
        >
          Back to report
        </button>
      </article>
    </PageLayout>
  )
}
