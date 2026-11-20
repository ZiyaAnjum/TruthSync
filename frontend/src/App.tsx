import { useEffect, useRef, useState } from 'react'
import { PageLayout } from './components/PageLayout'
import { HomeScreen } from './screens/HomeScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { ReportScreen } from './screens/ReportScreen'
import { ClaimDetailScreen } from './screens/ClaimDetailScreen'
import { getReport, startVerification } from './lib/dataSource'
import { getApiErrorMessage } from './lib/errors'
import type { ClaimReport, Report } from '../../shared/schemas'
import type { ProgressStatus } from './lib/progress'

const screenTitles = {
  home: 'Check an AI-generated answer | TruthSync',
  progress: 'Checking your answer | TruthSync',
  report: 'Verification report | TruthSync',
  'claim-detail': 'Claim detail | TruthSync',
} as const

function App() {
  const [screen, setScreen] = useState<'home' | 'progress' | 'report' | 'claim-detail'>('home')
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null)
  const [status, setStatus] = useState<ProgressStatus>({
    id: 'demo-progress',
    stage: 'queued',
    percent: 0,
    error: null,
  })
  const [report, setReport] = useState<Report | null>(null)
  const cancelProgressRef = useRef<(() => void) | null>(null)
  const activeRunRef = useRef(0)
  const requestedReportVariant = new URLSearchParams(window.location.search).get('report')
  const reportVariant =
    requestedReportVariant === 'many' ||
    requestedReportVariant === 'clean' ||
    requestedReportVariant === 'eight' ||
    requestedReportVariant === 'nocheck' ||
    requestedReportVariant === 'undated' ||
    requestedReportVariant === 'nosources'
      ? requestedReportVariant
      : undefined
  const selectedClaimReport: ClaimReport | undefined = report?.claims.find(
    ({ claim }) => claim.id === selectedClaimId,
  )

  function stopVerification() {
    activeRunRef.current += 1
    cancelProgressRef.current?.()
    cancelProgressRef.current = null
  }

  function returnToHome() {
    stopVerification()
    setScreen('home')
  }

  function handleVerify(answerText: string, question: string) {
    stopVerification()
    const runId = ++activeRunRef.current
    setStatus({
      id: 'demo-progress',
      stage: 'queued',
      percent: 0,
      error: null,
    })
    setReport(null)
    setScreen('progress')

    async function loadReport() {
      try {
        const nextReport = await getReport(reportVariant)
        if (activeRunRef.current !== runId) {
          return
        }
        setReport(nextReport)
        setScreen('report')
        cancelProgressRef.current = null
      } catch (error) {
        if (activeRunRef.current !== runId) {
          return
        }
        setStatus((currentStatus) => ({
          ...currentStatus,
          stage: 'failed',
          error: error instanceof Error ? error.message : getApiErrorMessage('INTERNAL'),
        }))
        cancelProgressRef.current = null
      }
    }

    cancelProgressRef.current = startVerification(answerText, question, (nextStatus) => {
      if (activeRunRef.current !== runId) {
        return
      }

      setStatus(nextStatus)
      if (nextStatus.stage === 'done') {
        void loadReport()
      }
    })
  }

  useEffect(() => {
    document.title = screenTitles[screen]
    const activeHeading = Array.from(
      document.querySelectorAll<HTMLElement>('main h1'),
    ).find((heading) => heading.getClientRects().length > 0)

    if (activeHeading) {
      activeHeading.tabIndex = -1
      activeHeading.focus()
    }
  }, [screen])

  useEffect(() => {
    return () => stopVerification()
  }, [])

  return (
    <>
      <div className={screen === 'home' ? 'screen-enter' : 'hidden'}>
        <HomeScreen onVerify={handleVerify} />
      </div>

      {screen === 'progress' && (
        <div key="progress" className="screen-enter">
          <ProgressScreen
            status={status}
            onCancel={returnToHome}
            onBack={returnToHome}
          />
        </div>
      )}

      {screen === 'report' && report && (
        <div key="report" className="screen-enter">
          <ReportScreen
            report={report}
            onSelectClaim={(claimId) => {
              setSelectedClaimId(claimId)
              setScreen('claim-detail')
            }}
            onBack={returnToHome}
          />
        </div>
      )}

      {screen === 'claim-detail' && selectedClaimReport && (
        <div key="claim-detail" className="screen-enter">
          <ClaimDetailScreen
            claimReport={selectedClaimReport}
            onBack={() => setScreen('report')}
          />
        </div>
      )}

      {screen === 'claim-detail' && !selectedClaimReport && (
        <div className="screen-enter">
          <PageLayout>
            <section
              aria-labelledby="claim-detail-placeholder-heading"
              className="premium-card mx-auto min-w-0 max-w-3xl p-5 sm:p-7"
            >
              <h1
                id="claim-detail-placeholder-heading"
                className="text-2xl font-bold text-slate-950"
              >
                Claim not found
              </h1>
              <button
                type="button"
                onClick={() => setScreen('report')}
                className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-900 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                Back
              </button>
            </section>
          </PageLayout>
        </div>
      )}
    </>
  )
}

export default App
