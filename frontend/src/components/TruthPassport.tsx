import { StatusBadge } from './StatusBadge'
import {
  verdictToStatus,
  volatilityToDisplay,
} from '../lib/status'
import type { ClaimReport } from '../../../shared/schemas'

type TruthPassportProps = {
  claimReport: ClaimReport
}

type PassportField =
  | 'status'
  | 'confidence'
  | 'freshness'
  | 'volatility'
  | 'recheck'
  | 'expiry'
  | 'reason'
  | 'checked'

const passportIconPaths: Record<PassportField, string> = {
  status: 'm6 10 2.2 2.2 4.8-5',
  confidence: 'M5 13l3-3 2 2 5-6',
  freshness: 'M5 13c1-5 5-8 10-8-1 5-4 9-9 10m2-3 4-4',
  volatility: 'm11 3-5 8h4l-1 6 5-8h-4l1-6',
  recheck: 'M10 6v4l3 2',
  expiry: 'M6 4v3m8-3v3M5 8h10M6 5h8v10H6z',
  reason: 'M10 8v5m0-8v.1',
  checked: 'M10 6v4l3 2',
}

function PassportLabel({
  field,
  children,
}: {
  field: PassportField
  children: string
}) {
  return (
    <dt className="passport-label flex items-center gap-2 text-sm font-semibold text-slate-700">
      <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path
          d={passportIconPaths[field]}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{children}</span>
    </dt>
  )
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
      className="premium-card min-w-0 p-5 sm:p-6"
    >
      <h2 id="truth-passport-heading" className="text-xl font-bold text-slate-950">
        Truth Passport
      </h2>
      <dl className="passport-grid mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <PassportLabel field="status">Status</PassportLabel>
          <dd className="mt-1"><StatusBadge status={status} /></dd>
        </div>
        <div className="min-w-0">
          <PassportLabel field="confidence">Confidence</PassportLabel>
          <dd className="mt-1 break-words text-sm text-slate-950">
            {claimReport.score.confidence} / 100
          </dd>
        </div>
        <div className="min-w-0">
          <PassportLabel field="freshness">Freshness score</PassportLabel>
          <dd className="mt-1 break-words text-sm text-slate-950">
            {claimReport.score.freshness_score} / 100
          </dd>
        </div>
        <div className="min-w-0">
          <PassportLabel field="volatility">Volatility</PassportLabel>
          <dd className="mt-1 break-words text-sm text-slate-950">
            {volatilityToDisplay(claimReport.expiry.volatility_class)}
          </dd>
        </div>
        <div className="min-w-0">
          <PassportLabel field="recheck">Recheck interval</PassportLabel>
          <dd className="mt-1 break-words text-sm text-slate-950">
            {claimReport.expiry.recheck_after_days === null
              ? 'No recheck needed'
              : `Recheck after ${claimReport.expiry.recheck_after_days} days`}
          </dd>
        </div>
        <div className="min-w-0">
          <PassportLabel field="expiry">Expires on</PassportLabel>
          <dd className="mt-1 break-words text-sm text-slate-950">
            {claimReport.expiry.expires_on ?? 'Not set'}
          </dd>
        </div>
        <div className="min-w-0">
          <PassportLabel field="reason">Expiry reason</PassportLabel>
          <dd className="mt-1 break-words text-sm leading-6 text-slate-950">
            {claimReport.expiry.reason}
          </dd>
        </div>
        <div className="min-w-0">
          <PassportLabel field="checked">Checked at</PassportLabel>
          <dd className="mt-1 break-words text-sm text-slate-950">
            {getCheckedAt(claimReport.evidence)}
          </dd>
        </div>
      </dl>
    </section>
  )
}
