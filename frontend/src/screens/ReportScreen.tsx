import { PageLayout } from '../components/PageLayout'
import { ClaimTable } from '../components/ClaimTable'
import { CorrectedAnswer } from '../components/CorrectedAnswer'
import { RiskList } from '../components/RiskList'
import { ScoreRing } from '../components/ScoreRing'
import { isDemoMode } from '../lib/dataSource'
import type { Report } from '../../../shared/schemas'

type ReportScreenProps = {
  report: Report
  onSelectClaim: (claimId: string) => void
  onBack: () => void
}

export function ReportScreen({
  report,
  onSelectClaim,
  onBack,
}: ReportScreenProps) {
  const hasCheckableClaims = report.claims.some(({ claim }) => claim.checkable)

  return (
    <PageLayout>
      <section aria-labelledby="report-heading" className="min-w-0">
        <h1 id="report-heading" className="mb-6 text-2xl font-bold text-slate-950">
          Verification report
        </h1>
        {isDemoMode && (
          <p className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M10 9v5M10 6v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Demo data (mock)
          </p>
        )}
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          <div className="premium-card report-score-card min-w-0 p-5 sm:p-7 lg:col-start-2 lg:row-start-1">
            {hasCheckableClaims ? (
              <>
                <p className="text-center text-sm font-semibold text-slate-700">
                  Overall freshness score
                </p>
                <div className="mt-4">
                  <ScoreRing score={report.overall_freshness_score} />
                </div>
              </>
            ) : (
              <p className="text-center text-sm font-semibold text-slate-700">
                No checkable claims found
              </p>
            )}
          </div>

          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <ClaimTable claims={report.claims} onSelect={onSelectClaim} />
          </div>

          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            <RiskList risks={report.risks} claims={report.claims} />
          </div>

          <div className="min-w-0 lg:col-start-2 lg:row-start-2">
            <CorrectedAnswer correction={report.correction} />
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="button-primary mt-6 w-full rounded-xl px-4 py-3 text-base font-bold outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
        >
          Check another answer
        </button>
      </section>
    </PageLayout>
  )
}
