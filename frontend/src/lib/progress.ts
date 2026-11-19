// Mirror of AnalysisStatus in shared/schemas.ts. Replace with an import when the API is connected.

export type ProgressStage =
  | 'queued'
  | 'extracting_claims'
  | 'predicting_expiry'
  | 'retrieving_evidence'
  | 'detecting_conflicts'
  | 'detecting_risks'
  | 'correcting'
  | 'done'
  | 'failed'
  | 'cancelled'

export type ProgressStatus = {
  id: string
  stage: ProgressStage
  percent: number
  error: string | null
}

export type DisplayStageId =
  | 'extracting_claims'
  | 'checking_sources'
  | 'comparing'
  | 'preparing_report'

export type DisplayStage = {
  id: DisplayStageId
  label: 'Extracting claims' | 'Checking sources' | 'Comparing' | 'Preparing report'
}

export type DisplayStageState = 'waiting' | 'in progress' | 'done' | 'failed'

export const DISPLAY_STAGES: DisplayStage[] = [
  { id: 'extracting_claims', label: 'Extracting claims' },
  { id: 'checking_sources', label: 'Checking sources' },
  { id: 'comparing', label: 'Comparing' },
  { id: 'preparing_report', label: 'Preparing report' },
]

export function mapBackendStageToDisplayStage(
  stage: ProgressStage,
): DisplayStageId | null {
  if (stage === 'extracting_claims') return 'extracting_claims'
  if (stage === 'predicting_expiry' || stage === 'retrieving_evidence') {
    return 'checking_sources'
  }
  if (stage === 'detecting_conflicts' || stage === 'detecting_risks') {
    return 'comparing'
  }
  if (stage === 'correcting') return 'preparing_report'
  return null
}

export function getDisplayStageState(
  stageId: DisplayStageId,
  status: ProgressStatus,
  lastActiveStageId: DisplayStageId | null,
): DisplayStageState {
  if (status.stage === 'failed' && lastActiveStageId === stageId) {
    return 'failed'
  }

  if (status.stage === 'done') {
    return 'done'
  }

  const stageOrder: DisplayStageId[] = [
    'extracting_claims',
    'checking_sources',
    'comparing',
    'preparing_report',
  ]
  const activeStageId = mapBackendStageToDisplayStage(status.stage)

  if (!activeStageId) {
    return 'waiting'
  }

  const stageIndex = stageOrder.indexOf(stageId)
  const activeIndex = stageOrder.indexOf(activeStageId)

  if (stageIndex < activeIndex) return 'done'
  if (stageIndex === activeIndex) return 'in progress'
  return 'waiting'
}
