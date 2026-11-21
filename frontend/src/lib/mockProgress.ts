// TEMPORARY MOCK. Simulates backend progress. Replaced by the real API in the API-connection step.

import type { ProgressStatus } from './progress'
import { getApiErrorMessage } from './errors'

type MockProgressOptions = {
  fail?: boolean
}

type MockProgressUpdate = (status: ProgressStatus) => void

export function startMockProgress(
  onUpdate: MockProgressUpdate,
  options: MockProgressOptions = {},
): () => void {
  const timers: number[] = []
  let stopped = false

  const send = (status: ProgressStatus) => {
    if (!stopped) {
      onUpdate(status)
    }
  }

  let elapsed = 0
  const schedule = (status: ProgressStatus) => {
    elapsed += 1500
    const timer = window.setTimeout(() => send(status), elapsed)
    timers.push(timer)
  }

  send({ id: 'demo-progress', stage: 'queued', percent: 0, error: null })
  schedule({ id: 'demo-progress', stage: 'extracting_claims', percent: 15, error: null })
  schedule({ id: 'demo-progress', stage: 'predicting_expiry', percent: 30, error: null })
  schedule({ id: 'demo-progress', stage: 'retrieving_evidence', percent: 50, error: null })

  const mockMode = new URLSearchParams(window.location.search).get('mock')

  if (options.fail || mockMode === 'error' || mockMode === 'ratelimit' || mockMode === 'timeout') {
    let errorMessage = 'Search service is not responding. Please try again.'
    if (mockMode === 'ratelimit') {
      errorMessage = getApiErrorMessage('RATE_LIMIT')
    } else if (mockMode === 'timeout') {
      errorMessage = getApiErrorMessage('TIMEOUT')
    } else if (mockMode === 'error') {
      errorMessage = getApiErrorMessage('SEARCH_FAILED')
    }

    const failedTimer = window.setTimeout(() => {
      send({
        id: 'demo-progress',
        stage: 'failed',
        percent: 50,
        error: errorMessage,
      })
    }, 6000)
    timers.push(failedTimer)
  } else {
    schedule({ id: 'demo-progress', stage: 'detecting_conflicts', percent: 70, error: null })
    schedule({ id: 'demo-progress', stage: 'detecting_risks', percent: 80, error: null })
    schedule({ id: 'demo-progress', stage: 'correcting', percent: 92, error: null })
    schedule({ id: 'demo-progress', stage: 'done', percent: 100, error: null })
  }

  return () => {
    stopped = true
    timers.forEach((timer) => window.clearTimeout(timer))
  }
}
