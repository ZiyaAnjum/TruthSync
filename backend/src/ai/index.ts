/**
 * TruthSync / TruthLens AI - AI Verification Engine (Member C)
 * Re-exports all public AI functions and types across tasks C-01 to C-08.
 */

// C-01: Claim Extraction
export {
  extractClaims,
  postProcessClaims,
} from "./extractClaims";

// C-02: Fact Expiry Predictor
export {
  predictExpiry,
  applyExpiryCalculations,
  computeExpiresOn,
  RECHECK_DAYS,
} from "./predictExpiry";

// C-03: Source Conflict Detective
export {
  detectConflicts,
  detectConflictsForAll,
  computeConflictVerdict,
} from "./detectConflicts";

// C-04: Hidden Risk Detector
export {
  detectRisks,
  postProcessRisks,
  shouldSkipRiskDetection,
} from "./detectRisks";

// C-05: Minimal Correction Engine
export {
  correctAnswer,
  applyChanges,
  type ClaimReportLike,
} from "./correctAnswer";

// C-07: Truth Timeline Event Builder
export {
  buildTimeline,
  postProcessTimelineEvents,
} from "./buildTimeline";

// C-08: Time-Travel Verification Engine
export {
  timeTravelVerify,
} from "./timeTravel";
export {
  TimeTravelResult,
} from "./types.p1";

// Fixture helpers for tests and integration
export {
  claimOutdatedCeo,
  claimPriceChange,
  claimCorrect,
  claimNoEvidence,
  fixtureClaims,
  evidenceOutdatedCeo,
  evidencePriceChange,
  evidenceCorrect,
  evidenceNoEvidence,
  mockEvidenceByClaimId,
} from "./__fixtures__/evidence";

