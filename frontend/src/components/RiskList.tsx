import type { ClaimReport, Risk } from '../../../shared/schemas'

type RiskListProps = {
  risks: Risk[]
  claims: ClaimReport[]
}

const severityLabels: Record<Risk['severity'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

function SeverityIcon({ severity }: { severity: Risk['severity'] }) {
  if (severity === 'high') {
    return (
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none">
        <path d="M10 2.5 18 17H2L10 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M10 7v4.5M10 14v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  if (severity === 'medium') {
    return (
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none">
        <path d="m10 2 8 8-8 8-8-8 8-8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M10 6v4M10 13v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M10 9v4M10 6.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function RiskList({ risks, claims }: RiskListProps) {
  const claimTextById = new Map(
    claims.map(({ claim }) => [claim.id, claim.text]),
  )

  return (
    <section
      aria-labelledby="risks-heading"
      className="premium-card report-fade-up min-w-0 p-5 sm:p-6"
    >
      <h2 id="risks-heading" className="text-xl font-bold text-slate-950">
        Risks
      </h2>
      {risks.length === 0 ? (
        <p className="mt-4 text-sm text-slate-700">No risks flagged.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {risks.map((risk) => (
            <li
              key={risk.id}
              className="risk-card premium-inner min-w-0 p-4"
            >
              <div className={`severity-chip severity-chip--${risk.severity} text-sm font-semibold`}>
                <SeverityIcon severity={risk.severity} />
                <span>{severityLabels[risk.severity]}</span>
              </div>
              <p className="mt-2 break-words text-sm leading-6 text-slate-800">
                {risk.description}
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-800">
                {risk.affected_claim_ids.map((claimId, index) => (
                  <li key={`${risk.id}-${claimId}-${index}`} className="break-words">
                    {claimTextById.get(claimId) ?? claimId}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
