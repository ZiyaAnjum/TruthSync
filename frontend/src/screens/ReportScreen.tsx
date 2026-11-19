import { PageLayout } from '../components/PageLayout'
import { ClaimTable } from '../components/ClaimTable'
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h1 id="report-heading" className="text-2xl font-bold text-slate-950">
            Verification report
          </h1>
          <div className="mt-5">
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
        </div>

        <div className="mt-6">
          <ClaimTable claims={report.claims} onSelect={onSelectClaim} />
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
