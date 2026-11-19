import { StatusBadge } from './StatusBadge'
import {
  verdictToStatus,
  volatilityToDisplay,
} from '../lib/status'
import type { ClaimReport } from '../../../shared/schemas'

type TruthPassportProps = {
  claimReport: ClaimReport
}

function getCheckedAt(evidence: ClaimReport['evidence']): string {
  let newestTimestamp: number | null = null

  for (const item of evidence) {
    const timestamp = Date.parse(item.retrieved_at)
    if (Number.isFinite(timestamp) && (newestTimestamp === null || timestamp > newestTimestamp)) {
      newestTimestamp = timestamp
    }
  }

  if (newestTimestamp === null) {
    return 'Not available'
  }

  const date = new Date(newestTimestamp)
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
}

export function TruthPassport({ claimReport }: TruthPassportProps) {
  const status = verdictToStatus(
    claimReport.conflict.verdict,
    claimReport.claim.checkable,
  )

  return (
    <section
      aria-labelledby="truth-passport-heading"
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 id="truth-passport-heading" className="text-xl font-bold text-slate-950">
        Truth Passport
      </h2>
      <dl className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-sm font-semibold text-slate-700">Status</dt>
          <dd className="mt-1"><StatusBadge status={status} /></dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm font-semibold text-slate-700">Confidence</dt>
          <dd className="mt-1 break-words text-sm text-slate-950">
            {claimReport.score.confidence} / 100
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm font-semibold text-slate-700">Freshness score</dt>
          <dd className="mt-1 break-words text-sm text-slate-950">
            {claimReport.score.freshness_score} / 100
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm font-semibold text-slate-700">Volatility</dt>
          <dd className="mt-1 break-words text-sm text-slate-950">
            {volatilityToDisplay(claimReport.expiry.volatility_class)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm font-semibold text-slate-700">Recheck interval</dt>
          <dd className="mt-1 break-words text-sm text-slate-950">
            {claimReport.expiry.recheck_after_days === null
              ? 'No recheck needed'
              : `Recheck after ${claimReport.expiry.recheck_after_days} days`}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm font-semibold text-slate-700">Expires on</dt>
          <dd className="mt-1 break-words text-sm text-slate-950">
            {claimReport.expiry.expires_on ?? 'Not set'}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm font-semibold text-slate-700">Expiry reason</dt>
          <dd className="mt-1 break-words text-sm leading-6 text-slate-950">
            {claimReport.expiry.reason}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm font-semibold text-slate-700">Checked at</dt>
          <dd className="mt-1 break-words text-sm text-slate-950">
            {getCheckedAt(claimReport.evidence)}
          </dd>
        </div>
      </dl>
    </section>
  )
}
