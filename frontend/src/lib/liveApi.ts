import type { AnalysisStatus, ApiError, Report } from '../../../shared/schemas'
import { getApiErrorMessage, getNetworkErrorMessage } from './errors'

const pollIntervalMs = 2000
const timeoutMs = 3 * 60 * 1000
const apiErrorCodes = new Set([
  'VALIDATION',
  'RATE_LIMIT',
  'TIMEOUT',
  'LLM_FAILED',
  'SEARCH_FAILED',
  'NOT_FOUND',
  'INTERNAL',
])

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '')

type VerificationContext = {
  controller: AbortController
  onUpdate: (status: AnalysisStatus) => void
  verificationId: string | null
  report: Report | null
  cancelled: boolean
  settled: boolean
  reportPending: boolean
  timedOut: boolean
  pollingTimer: number | undefined
  timeoutTimer: number | undefined
}

let latestVerification: VerificationContext | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isApiError(value: unknown): value is ApiError {
  if (!isRecord(value) || !isRecord(value.error)) {
    return false
  }

  const { code, message } = value.error
  return typeof code === 'string' && apiErrorCodes.has(code) && typeof message === 'string'
}

function isReport(value: unknown): value is Report {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    Array.isArray(value.claims) &&
    typeof value.overall_freshness_score === 'number' &&
    Number.isFinite(value.overall_freshness_score)
  )
}

function isAnalysisStage(value: unknown): value is AnalysisStatus['stage'] {
  return (
    value === 'queued' ||
    value === 'extracting_claims' ||
    value === 'predicting_expiry' ||
    value === 'retrieving_evidence' ||
    value === 'detecting_conflicts' ||
    value === 'detecting_risks' ||
    value === 'correcting' ||
    value === 'done' ||
    value === 'failed' ||
    value === 'cancelled'
  )
}

function isAnalysisStatus(value: unknown): value is AnalysisStatus {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    isAnalysisStage(value.stage) &&
    typeof value.percent === 'number' &&
    Number.isFinite(value.percent) &&
    value.percent >= 0 &&
    value.percent <= 100 &&
    (typeof value.error === 'string' || value.error === null)
  )
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function clearTimers(context: VerificationContext) {
  if (context.pollingTimer !== undefined) {
    window.clearTimeout(context.pollingTimer)
    context.pollingTimer = undefined
  }
  if (context.timeoutTimer !== undefined) {
    window.clearTimeout(context.timeoutTimer)
    context.timeoutTimer = undefined
  }
}

function fail(context: VerificationContext, message: string) {
  if (context.cancelled || context.settled) {
    return
  }

  context.settled = true
  clearTimers(context)
  context.onUpdate({
    id: context.verificationId ?? '',
    stage: 'failed',
    percent: 0,
    error: message,
  })
  context.controller.abort()
}

function getHttpError(response: Response, body: unknown): Error {
  if (response.status === 429) {
    return new Error(getApiErrorMessage('RATE_LIMIT'))
  }
  if (isApiError(body)) {
    return new Error(getApiErrorMessage(body.error.code))
  }
  return new Error(getApiErrorMessage('INTERNAL'))
}

async function fetchResponse(
  context: VerificationContext,
  input: string,
  init: RequestInit,
): Promise<Response | null> {
  try {
    return await fetch(input, init)
  } catch {
    if (!context.cancelled && !context.settled) {
      fail(context, getNetworkErrorMessage())
    }
    return null
  }
}

function isActive(context: VerificationContext) {
  return !context.cancelled && !context.settled
}

function schedulePoll(context: VerificationContext) {
  if (!isActive(context)) {
    return
  }

  context.pollingTimer = window.setTimeout(() => {
    context.pollingTimer = undefined
    void pollVerification(context)
  }, pollIntervalMs)
}

async function pollVerification(context: VerificationContext) {
  if (!isActive(context) || !context.verificationId) {
    return
  }

  // ASSUMPTION (verify with Eifa at integration): GET /api/verifications/{id} returns an ApiError, Report, or AnalysisStatus JSON object.
  const response = await fetchResponse(
    context,
    `${baseUrl}/api/verifications/${encodeURIComponent(context.verificationId)}`,
    {
      credentials: 'omit',
      signal: context.controller.signal,
    },
  )
  if (!response || !isActive(context)) {
    return
  }

  const body = await readJson(response)
  if (!isActive(context)) {
    return
  }
  if (!response.ok) {
    fail(context, getHttpError(response, body).message)
    return
  }
  if (isApiError(body)) {
    fail(context, getApiErrorMessage(body.error.code))
    return
  }
  if (isReport(body)) {
    context.report = body
    context.verificationId = body.id
    context.reportPending = false
    context.settled = true
    clearTimers(context)
    context.onUpdate({
      id: body.id,
      stage: 'done',
      percent: 100,
      error: null,
    })
    return
  }
  if (!isAnalysisStatus(body)) {
    fail(context, getApiErrorMessage('INTERNAL'))
    return
  }

  context.onUpdate(body)
  if (body.stage === 'done' || body.stage === 'failed' || body.stage === 'cancelled') {
    context.reportPending = body.stage === 'done'
    context.settled = true
    if (!context.reportPending) {
      clearTimers(context)
    }
    return
  }
  schedulePoll(context)
}

async function submitVerification(context: VerificationContext, answerText: string) {
  // ASSUMPTION (verify with Eifa at integration): POST /api/verify accepts answer_text and returns JSON containing a string id.
  const response = await fetchResponse(context, `${baseUrl}/api/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    signal: context.controller.signal,
    body: JSON.stringify({ answer_text: answerText }),
  })
  if (!response || !isActive(context)) {
    return
  }

  const body = await readJson(response)
  if (!isActive(context)) {
    return
  }
  if (!response.ok) {
    fail(context, getHttpError(response, body).message)
    return
  }
  if (isApiError(body)) {
    fail(context, getApiErrorMessage(body.error.code))
    return
  }
  if (!isRecord(body) || typeof body.id !== 'string' || body.id.length === 0) {
    fail(context, getApiErrorMessage('INTERNAL'))
    return
  }

  context.verificationId = body.id
  schedulePoll(context)
}

export function startVerification(
  answerText: string,
  onUpdate: (status: AnalysisStatus) => void,
): () => void {
  const context: VerificationContext = {
    controller: new AbortController(),
    onUpdate,
    verificationId: null,
    report: null,
    cancelled: false,
    settled: false,
    reportPending: false,
    timedOut: false,
    pollingTimer: undefined,
    timeoutTimer: undefined,
  }
  latestVerification = context

  // ASSUMPTION (verify with Eifa at integration): polling is every 2 seconds and verification has a 3-minute overall limit.
  context.timeoutTimer = window.setTimeout(() => {
    if (context.cancelled || context.report || context.timedOut) {
      return
    }
    context.settled = true
    context.timedOut = true
    clearTimers(context)
    context.controller.abort()
    if (!context.reportPending) {
      context.onUpdate({
        id: context.verificationId ?? '',
        stage: 'failed',
        percent: 0,
        error: getApiErrorMessage('TIMEOUT'),
      })
    }
  }, timeoutMs)

  void submitVerification(context, answerText)

  return () => {
    if (context.cancelled) {
      return
    }
    context.cancelled = true
    clearTimers(context)
    context.controller.abort()
  }
}

export async function getReport(): Promise<Report> {
  const context = latestVerification
  if (!context || !context.verificationId) {
    throw new Error(getApiErrorMessage('INTERNAL'))
  }
  if (context.report) {
    return context.report
  }
  if (context.cancelled) {
    throw new Error(getApiErrorMessage('INTERNAL'))
  }
  if (context.timedOut) {
    throw new Error(getApiErrorMessage('TIMEOUT'))
  }

  // ASSUMPTION (verify with Eifa at integration): a completed status can be followed by one GET for the full Report.
  const response = await fetchResponse(context, `${baseUrl}/api/verifications/${encodeURIComponent(context.verificationId)}`, {
    credentials: 'omit',
    signal: context.controller.signal,
  })
  if (!response) {
    const message = context.timedOut
      ? getApiErrorMessage('TIMEOUT')
      : context.cancelled
        ? getApiErrorMessage('INTERNAL')
        : getNetworkErrorMessage()
    context.settled = true
    clearTimers(context)
    throw new Error(message)
  }

  const body = await readJson(response)
  if (context.timedOut || context.cancelled) {
    context.settled = true
    clearTimers(context)
    throw new Error(context.timedOut ? getApiErrorMessage('TIMEOUT') : getApiErrorMessage('INTERNAL'))
  }
  if (!response.ok) {
    context.settled = true
    context.reportPending = false
    clearTimers(context)
    throw getHttpError(response, body)
  }
  if (isApiError(body)) {
    context.settled = true
    context.reportPending = false
    clearTimers(context)
    throw new Error(getApiErrorMessage(body.error.code))
  }
  if (!isReport(body)) {
    context.settled = true
    context.reportPending = false
    clearTimers(context)
    throw new Error(getApiErrorMessage('INTERNAL'))
  }

  if (!context.cancelled) {
    context.report = body
    context.verificationId = body.id
    context.reportPending = false
    context.settled = true
    clearTimers(context)
  }
  return body
}

// ASSUMPTION (verify with Eifa at integration): VITE_API_BASE_URL is the sole live API base URL configuration.
export const isLiveApiConfigured = baseUrl.length > 0

// ASSUMPTION (verify with Eifa at integration): Add full schema validation (shared/schemas.ts) at integration.
