import { useEffect, useRef, useState } from 'react'
import { PageLayout } from './components/PageLayout'
import { HomeScreen } from './screens/HomeScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { ReportScreen } from './screens/ReportScreen'
import { startMockProgress } from './lib/mockProgress'
import { getMockReport } from './lib/mockReport'
import type { ProgressStatus } from './lib/progress'

function App() {
  const [screen, setScreen] = useState<'home' | 'progress' | 'report' | 'claim-detail'>('home')
  const [status, setStatus] = useState<ProgressStatus>({
    id: 'demo-progress',
    stage: 'queued',
    percent: 0,
    error: null,
  })
  const cancelProgressRef = useRef<(() => void) | null>(null)
  const requestedReportVariant = new URLSearchParams(window.location.search).get('report')
  const reportVariant =
    requestedReportVariant === 'many' || requestedReportVariant === 'clean'
      ? requestedReportVariant
      : undefined
  const mockReport = getMockReport(reportVariant)

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

    const shouldFail = new URLSearchParams(window.location.search).get('mock') === 'error'
    cancelProgressRef.current = startMockProgress((nextStatus) => {
      setStatus(nextStatus)
      if (nextStatus.stage === 'done') {
        setScreen('report')
        stopMockProgress()
      }
    }, { fail: shouldFail })
  }

  useEffect(() => {
    return () => stopMockProgress()
  }, [])

  return (
    <>
      <div className={screen === 'home' ? '' : 'hidden'}>
        <HomeScreen onVerify={handleVerify} />
      </div>

      {screen === 'progress' && (
        <ProgressScreen
          status={status}
          onCancel={returnToHome}
          onBack={returnToHome}
        />
      )}

      {screen === 'report' && (
        <ReportScreen
          report={mockReport}
          onSelectClaim={() => setScreen('claim-detail')}
          onBack={returnToHome}
        />
      )}

      {screen === 'claim-detail' && (
        <PageLayout>
          <section
            aria-labelledby="claim-detail-placeholder-heading"
            className="mx-auto min-w-0 max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <h1
              id="claim-detail-placeholder-heading"
              className="text-2xl font-bold text-slate-950"
            >
              Claim Detail comes in task A-05
            </h1>
            <button
              type="button"
              onClick={() => setScreen('report')}
              className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-900 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              Back to report
            </button>
          </section>
        </PageLayout>
      )}
    </>
  )
}

export default App
