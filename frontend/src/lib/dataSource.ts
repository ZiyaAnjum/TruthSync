// At integration, replace the bodies of these functions with real API calls and set isDemoMode from the environment. This is the ONLY file that should change. Screens must never import mockProgress or mockReport directly.

import type { AnalysisStatus, Report } from '../../../shared/schemas'
import { getMockReport } from './mockReport'
import { startMockProgress } from './mockProgress'

export const isDemoMode = true

export function startVerification(
  _answerText: string,
  _question: string,
  onUpdate: (status: AnalysisStatus) => void,
): () => void {
  return startMockProgress(onUpdate)
}

export function getReport(variant?: string): Report {
  return getMockReport(variant)
}
