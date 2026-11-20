import { useEffect, useRef, useState } from 'react'
import { PageLayout } from './components/PageLayout'
import { HomeScreen } from './screens/HomeScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { ReportScreen } from './screens/ReportScreen'
import { ClaimDetailScreen } from './screens/ClaimDetailScreen'
import { getReport, startVerification } from './lib/dataSource'
import type { ClaimReport } from '../../shared/schemas'
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
  const cancelProgressRef = useRef<(() => void) | null>(null)
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
  const mockReport = getReport(reportVariant)
  const selectedClaimReport: ClaimReport | undefined = mockReport.claims.find(
    ({ claim }) => claim.id === selectedClaimId,
  )

  function stopMockProgress() {
    cancelProgressRef.current?.()
    cancelProgressRef.current = null
  }

  function returnToHome() {
    stopMockProgress()
    setScreen('home')
  }

  function handleVerify(_answerText: string, _question: string) {
    stopMockProgress()
    setStatus({
      id: 'demo-progress',
      stage: 'queued',
      percent: 0,
      error: null,
    })
    setScreen('progress')

    cancelProgressRef.current = startVerification(_answerText, _question, (nextStatus) => {
      setStatus(nextStatus)
      if (nextStatus.stage === 'done') {
        setScreen('report')
        stopMockProgress()
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
    return () => stopMockProgress()
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

      {screen === 'report' && (
        <div key="report" className="screen-enter">
          <ReportScreen
            report={mockReport}
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
