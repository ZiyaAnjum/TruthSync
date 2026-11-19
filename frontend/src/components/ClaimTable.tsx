import { useState } from 'react'
import { StatusBadge } from './StatusBadge'
import {
  type DisplayStatus,
  verdictToStatus,
  volatilityToDisplay,
} from '../lib/status'
import type { ClaimReport } from '../../../shared/schemas'

type ClaimTableProps = {
  claims: ClaimReport[]
  onSelect: (claimId: string) => void
}

const STATUS_OPTIONS: DisplayStatus[] = [
  'Supported',
  'Outdated',
  'Conflicting',
  'Insufficient Evidence',
  'Not Checked',
]

function ExpiryDetails({ claim }: { claim: ClaimReport }) {
  return (
    <div className="break-words text-sm text-slate-800">
      <p className="font-semibold">
        {volatilityToDisplay(claim.expiry.volatility_class)} volatility
      </p>
      <p className="mt-1">
        Recheck:{' '}
        {claim.expiry.recheck_after_days === null
          ? 'Not scheduled'
          : `${claim.expiry.recheck_after_days} days`}
      </p>
      <p className="mt-1">
        Expires: {claim.expiry.expires_on ?? 'No expiry date'}
      </p>
    </div>
  )
}

export function ClaimTable({ claims, onSelect }: ClaimTableProps) {
  const [selectedStatus, setSelectedStatus] = useState<DisplayStatus | 'all'>('all')
  const visibleClaims = claims.filter((claim) => {
    const status = verdictToStatus(claim.conflict.verdict, claim.claim.checkable)
    return selectedStatus === 'all' || status === selectedStatus
  })

  return (
    <section
      aria-labelledby="claims-heading"
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
        <h2 id="claims-heading" className="text-xl font-bold text-slate-950">
          Claims
        </h2>
        <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-slate-800">
          Filter by status
          <select
            value={selectedStatus}
            onChange={(event) => {
              const value = event.currentTarget.value
              setSelectedStatus(
                STATUS_OPTIONS.find((status) => status === value) ?? 'all',
              )
            }}
            className="max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visibleClaims.length === 0 ? (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          No claims match this status.
        </p>
      ) : (
        <>
          <div className="mt-5 hidden min-w-0 md:block">
            <table className="w-full table-fixed border-collapse text-left">
              <caption className="sr-only">Claims in this verification report</caption>
              <colgroup>
                <col className="w-[29%]" />
                <col className="w-[19%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[19%]" />
                <col className="w-[11%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-300 text-sm text-slate-700">
                  <th scope="col" className="px-2 py-3 font-semibold">Claim</th>
                  <th scope="col" className="px-2 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-2 py-3 font-semibold">Freshness</th>
                  <th scope="col" className="px-2 py-3 font-semibold">Confidence</th>
                  <th scope="col" className="px-2 py-3 font-semibold">Expiry</th>
                  <th scope="col" className="px-2 py-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {visibleClaims.map((claim) => {
                  const status = verdictToStatus(
                    claim.conflict.verdict,
                    claim.claim.checkable,
                  )

                  return (
                    <tr key={claim.claim.id} className="border-b border-slate-200 last:border-0">
                      <td className="break-words px-2 py-4 text-sm font-medium text-slate-950">
                        {claim.claim.text}
                      </td>
                      <td className="break-words px-2 py-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="break-words px-2 py-4 text-sm font-semibold text-slate-950">
                        {claim.score.freshness_score} / 100
                      </td>
                      <td className="break-words px-2 py-4 text-sm font-semibold text-slate-950">
                        {claim.score.confidence} / 100
                      </td>
                      <td className="break-words px-2 py-4">
                        <ExpiryDetails claim={claim} />
                      </td>
                      <td className="break-words px-2 py-4">
                        <button
                          type="button"
                          onClick={() => onSelect(claim.claim.id)}
                          aria-label={`View details for claim: ${claim.claim.text}`}
                          className="rounded-lg border border-blue-800 px-2 py-2 text-sm font-semibold text-blue-900 outline-none hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <ul className="mt-5 grid min-w-0 grid-cols-1 gap-3 md:hidden">
            {visibleClaims.map((claim) => {
              const status = verdictToStatus(
                claim.conflict.verdict,
                claim.claim.checkable,
              )

              return (
                <li
                  key={claim.claim.id}
                  className="min-w-0 rounded-xl border border-slate-200 p-4"
                >
                  <h3 className="break-words text-sm font-semibold leading-6 text-slate-950">
                    {claim.claim.text}
                  </h3>
                  <dl className="mt-4 grid min-w-0 grid-cols-2 gap-x-3 gap-y-4">
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold text-slate-600">Status</dt>
                      <dd className="mt-1"><StatusBadge status={status} /></dd>
                    </div>
                    <div className="min-w-0 break-words">
                      <dt className="text-xs font-semibold text-slate-600">Freshness</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-950">
                        {claim.score.freshness_score} / 100
                      </dd>
                    </div>
                    <div className="min-w-0 break-words">
                      <dt className="text-xs font-semibold text-slate-600">Confidence</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-950">
                        {claim.score.confidence} / 100
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold text-slate-600">Expiry</dt>
                      <dd className="mt-1"><ExpiryDetails claim={claim} /></dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => onSelect(claim.claim.id)}
                    aria-label={`View details for claim: ${claim.claim.text}`}
                    className="mt-4 rounded-lg border border-blue-800 px-3 py-2 text-sm font-semibold text-blue-900 outline-none hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                  >
                    View details
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
