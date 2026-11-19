import { PageLayout } from './components/PageLayout'
import { StatusBadge } from './components/StatusBadge'
import type { DisplayStatus } from './lib/status'

function App() {
  const statuses: DisplayStatus[] = [
    'Supported',
    'Outdated',
    'Conflicting',
    'Insufficient Evidence',
    'Not Checked',
  ]

  return (
    <PageLayout>
      <section
        aria-labelledby="preview-heading"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          A-01 preview
        </p>
        <h2 id="preview-heading" className="text-2xl font-bold text-slate-950">
          Design system preview
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Temporary preview. Later tasks will replace this page with the product screens.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {statuses.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </section>
    </PageLayout>
  )
}

export default App
