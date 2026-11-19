import { PageLayout } from '../components/PageLayout'
import { ClaimTable } from '../components/ClaimTable'
import { CorrectedAnswer } from '../components/CorrectedAnswer'
import { RiskList } from '../components/RiskList'
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
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:col-start-2 lg:row-start-1">
            {hasCheckableClaims ? (
              <>
                <p className="text-sm font-semibold text-slate-700">
                  Overall freshness score
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-950">
                  {report.overall_freshness_score}
                  <span className="ml-1 text-lg font-semibold text-slate-600">/ 100</span>
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-slate-700">
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
          className="mt-6 w-full rounded-xl bg-blue-800 px-4 py-3 text-base font-bold text-white outline-none hover:bg-blue-900 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
        >
          Check another answer
        </button>
      </section>
    </PageLayout>
  )
}
