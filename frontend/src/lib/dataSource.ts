import type { AnalysisStatus, Report } from '../../../shared/schemas'
import { getMockReport } from './mockReport'
import { startMockProgress } from './mockProgress'
import { getReport as getLiveReport, isLiveApiConfigured, startVerification as startLiveVerification } from './liveApi'

export const isDemoMode = !isLiveApiConfigured

export function startVerification(
  answerText: string,
  _question: string,
  onUpdate: (status: AnalysisStatus) => void,
): () => void {
  if (isDemoMode) {
    return startMockProgress(onUpdate)
  }

  return startLiveVerification(answerText, onUpdate)
}

export async function getReport(variant?: string): Promise<Report> {
  if (isDemoMode) {
    return getMockReport(variant)
  }
  return getLiveReport()
}
