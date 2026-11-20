import { useEffect, useRef } from 'react'
import { PageLayout } from '../components/PageLayout'
import {
  DISPLAY_STAGES,
  getDisplayStageState,
  mapBackendStageToDisplayStage,
  type DisplayStageId,
  type ProgressStatus,
} from '../lib/progress'

type ProgressScreenProps = {
  status: ProgressStatus
  onCancel: () => void
  onBack: () => void
}

function StateIcon({ state }: { state: 'waiting' | 'in progress' | 'done' | 'failed' }) {
  if (state === 'done') {
    return (
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
        <path className="stage-check" pathLength={1} d="m6.5 10 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (state === 'failed') {
    return (
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="M10 6v4.5M10 14v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  if (state === 'in progress') {
    return (
      <svg className="animate-spin motion-reduce:animate-none" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
        <path d="M18 10a8 8 0 0 0-8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="2" />
      <path d="M10 6v4l2.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ProgressScreen({ status, onCancel, onBack }: ProgressScreenProps) {
  const lastActiveStageRef = useRef<DisplayStageId | null>(null)

  useEffect(() => {
    if (status.stage !== 'failed') {
      const activeStage = mapBackendStageToDisplayStage(status.stage)
      if (activeStage) {
        lastActiveStageRef.current = activeStage
      }
    }
  }, [status.stage])

  const activeLabel = DISPLAY_STAGES.find(
    (stage) => stage.id === mapBackendStageToDisplayStage(status.stage),
  )?.label

  const liveMessage =
    status.stage === 'failed'
      ? 'Verification failed'
      : status.stage === 'done'
        ? 'Preparing report complete'
        : activeLabel
          ? `${activeLabel} in progress`
          : 'Verification queued'

  return (
    <PageLayout>
      <section
        aria-labelledby="progress-heading"
        className="premium-card mx-auto min-w-0 max-w-3xl p-5 sm:p-7"
      >
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Demo data (mock)
        </p>
        <h1 id="progress-heading" className="mt-2 text-2xl font-bold text-slate-950">
          Checking your answer
        </h1>

        <p aria-live="polite" className="mt-2 text-sm text-slate-600">
          {liveMessage}
        </p>

        {status.stage === 'failed' && (
          <div
            role="alert"
            className="error-banner mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-950"
          >
            {status.error}
          </div>
        )}

        <div className="mt-6">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={status.percent}
            aria-label="Verification progress"
            className="progress-track h-3 w-full"
          >
            <div
              className="progress-fill"
              style={{ transform: `scaleX(${status.percent / 100})` }}
            >
              <span className="progress-shimmer" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-700">{status.percent}%</p>
        </div>

        <ol className="mt-6 grid grid-cols-1 gap-3">
          {DISPLAY_STAGES.map((stage) => {
            const state = getDisplayStageState(
              stage.id,
              status,
              lastActiveStageRef.current,
            )
            const stateStyle =
              state === 'done'
                ? 'border-green-300 bg-green-50 text-green-950'
                : state === 'failed'
                  ? 'border-red-300 bg-red-50 text-red-950'
                  : state === 'in progress'
                    ? 'border-blue-300 bg-blue-50 text-blue-950'
                    : 'border-slate-200 bg-slate-50 text-slate-700'

            return (
              <li
                key={stage.id}
                className={`stage-card flex min-w-0 items-center justify-between gap-3 rounded-xl border px-4 py-3 ${stateStyle} ${
                  state === 'in progress' ? 'stage-active' : ''
                }`}
              >
                <span className="min-w-0 text-sm font-semibold">{stage.label}</span>
                <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold">
                  <StateIcon state={state} />
                  <span>
                    {state === 'in progress'
                      ? 'In progress'
                      : state.charAt(0).toUpperCase() + state.slice(1)}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>

        {status.stage === 'failed' ? (
          <button
            type="button"
            onClick={onBack}
            className="button-primary mt-6 w-full rounded-xl px-4 py-3 text-base font-bold outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            Back to Home
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-900 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            Cancel
          </button>
        )}
      </section>
    </PageLayout>
  )
}
