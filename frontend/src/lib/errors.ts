import type { ApiError } from '../../../shared/schemas'

type ApiErrorCode = ApiError['error']['code']

const apiErrorMessages: Record<ApiErrorCode, string> = {
  VALIDATION: 'Check your answer for missing or invalid content, then try again.',
  RATE_LIMIT: 'Too many requests right now. Wait a moment, then try again.',
  TIMEOUT: 'The check took too long to finish. Try again in a moment.',
  LLM_FAILED: "We couldn't complete the analysis. Try again in a moment.",
  SEARCH_FAILED: 'Search is unavailable or slow. Affected claims may show Insufficient Evidence. Try again shortly.',
  NOT_FOUND: "We couldn't find that verification. Return to the report and try again.",
  INTERNAL: 'Something went wrong while preparing the report. Please try again.',
}

const genericErrorMessage = 'Something went wrong. Please try again.'
const networkErrorMessage = "Couldn't connect to TruthSync. Check your internet connection, then try again."

function isApiErrorCode(code: string): code is ApiErrorCode {
  return Object.prototype.hasOwnProperty.call(apiErrorMessages, code)
}

export function getApiErrorMessage(code: string): string {
  return isApiErrorCode(code) ? apiErrorMessages[code] : genericErrorMessage
}

export function getNetworkErrorMessage(): string {
  return networkErrorMessage
}
