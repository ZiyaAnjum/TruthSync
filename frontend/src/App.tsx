import { useEffect, useRef, useState } from 'react'
import { PageLayout } from './components/PageLayout'
import { HomeScreen } from './screens/HomeScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { startMockProgress } from './lib/mockProgress'
import { getMockReport } from './lib/mockReport'
import type { ProgressStatus } from './lib/progress'

function App() {
  const [screen, setScreen] = useState<'home' | 'progress' | 'report'>('home')
  const [status, setStatus] = useState<ProgressStatus>({
    id: 'demo-progress',
    stage: 'queued',
    percent: 0,
    error: null,
  })
  const cancelProgressRef = useRef<(() => void) | null>(null)
  const reportVariant = new URLSearchParams(window.location.search).get('report') === 'many'
    ? 'many'
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
        <PageLayout>
          <section
            aria-labelledby="report-placeholder-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <h1 id="report-placeholder-heading" className="text-2xl font-bold text-slate-950">
              Demo report loaded: {mockReport.claims.length} claim(s), overall freshness score{' '}
              {mockReport.overall_freshness_score}
            </h1>
            <button
              type="button"
              onClick={returnToHome}
              className="mt-6 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              Back to Home
            </button>
          </section>
        </PageLayout>
      )}
    </>
  )
}

export default App
