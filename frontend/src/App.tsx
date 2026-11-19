import { useState } from 'react'
import { PageLayout } from './components/PageLayout'
import { HomeScreen } from './screens/HomeScreen'

function App() {
  const [showProgressPlaceholder, setShowProgressPlaceholder] = useState(false)

  return (
    <>
      <div className={showProgressPlaceholder ? 'hidden' : ''}>
        <HomeScreen onVerify={() => setShowProgressPlaceholder(true)} />
      </div>

      {showProgressPlaceholder && (
        <PageLayout>
          <section
            aria-labelledby="progress-placeholder-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <h1 id="progress-placeholder-heading" className="text-2xl font-bold text-slate-950">
              Progress screen comes in task A-03
            </h1>
            <button
              type="button"
              onClick={() => setShowProgressPlaceholder(false)}
              className="mt-6 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              Back
            </button>
          </section>
        </PageLayout>
      )}
    </>
  )
}

export default App
