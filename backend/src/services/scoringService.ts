import "../preload";
import { ClaimScore, Evidence } from "../../../shared/schemas";
import { z } from "zod";

/**
 * Agreed claim status points according to PRD Section 4:
 * - Supported = 1.0
 * - Conflicting = 0.5
 * - Insufficient Evidence = 0.5
 * - Outdated = 0.0
 *
 * Maps both PRD display names and shared/schemas.ts Verdict enum values.
 */
export const CLAIM_POINTS: Record<string, number> = {
  // PRD display names (case-insensitive keys)
  "supported": 1.0,
  "conflicting": 0.5,
  "insufficient evidence": 0.5,
  "outdated": 0.0,

  // Shared schema Verdict enum values
  "current": 1.0,
  "disputed": 0.5,
  "unverifiable": 0.5,
};

/**
 * Penalties deducted from initial AI confidence:
 * - Single source: -20
 * - Undated source: -15
 * - Conflicting sources: -25
 */
export const CONFIDENCE_PENALTIES = {
  SINGLE_SOURCE: 20,
  UNDATED_SOURCE: 15,
  CONFLICTING_SOURCES: 25,
} as const;

export interface ConfidenceOptions {
  isSingleSource?: boolean;
  hasUndatedSource?: boolean;
  hasConflictingSources?: boolean;
}

/**
 * Normalizes a status string for point lookup.
 */
function normalizeStatus(status: string): string {
  return status.trim().toLowerCase();
}

/**
 * Calculates the freshness score for a single claim based on its status.
 * Returns a number between 0 and 100.
 */
export function calculateClaimFreshnessScore(status: string): number {
  if (!status || typeof status !== "string") {
    return 0;
  }

  const normalized = normalizeStatus(status);
  if (normalized in CLAIM_POINTS) {
    return Math.round(CLAIM_POINTS[normalized] * 100);
  }

  return 0;
}

/**
 * Calculates the overall freshness score across a list of claim statuses.
 * Formula: Freshness Score = (Average of all claim points) * 100
 *
 * Rules:
 * - Supported = 1.0, Conflicting = 0.5, Insufficient Evidence = 0.5, Outdated = 0
 * - "Not Checked" claims are excluded from calculation.
 * - Safely handles empty input (returns 0, no division by zero).
 * - Always returns a rounded whole number between 0 and 100.
 */
export function calculateOverallFreshnessScore(statuses: string[]): number {
  if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
    return 0;
  }

  let totalPoints = 0;
  let checkableCount = 0;

  for (const rawStatus of statuses) {
    if (!rawStatus || typeof rawStatus !== "string") {
      continue;
    }

    const normalized = normalizeStatus(rawStatus);

    // Skip "Not Checked" or outside-scope claims per PRD Section 4
    if (normalized === "not checked" || normalized === "not_checked") {
      continue;
    }

    if (normalized in CLAIM_POINTS) {
      totalPoints += CLAIM_POINTS[normalized];
      checkableCount++;
    }
  }

  if (checkableCount === 0) {
    return 0;
  }

  const average = totalPoints / checkableCount;
  const scoreValue = Math.round(average * 100);

  // Clamp strictly between 0 and 100
  return Math.max(0, Math.min(100, scoreValue));
}

/**
 * Calculates the final confidence score by applying penalties to the initial AI confidence.
 * Formula: Final Confidence = Initial AI Confidence - Applicable Penalties
 *
 * Penalties:
 * - Single source: -20
 * - Undated source: -15
 * - Conflicting sources: -25
 *
 * Rules:
 * - Minimum score = 0, Maximum score = 100 (never negative).
 * - Penalties are applied at most once per category.
 * - Deterministic, computed purely in code without AI.
 */
export function calculateConfidenceScore(
  initialConfidence: number,
  options?: ConfidenceOptions
): number {
  if (typeof initialConfidence !== "number" || isNaN(initialConfidence)) {
    return 0;
  }

  // Clamp initial confidence between 0 and 100
  const clampedInitial = Math.max(0, Math.min(100, initialConfidence));

  let totalPenalty = 0;

  if (options?.isSingleSource) {
    totalPenalty += CONFIDENCE_PENALTIES.SINGLE_SOURCE;
  }
  if (options?.hasUndatedSource) {
    totalPenalty += CONFIDENCE_PENALTIES.UNDATED_SOURCE;
  }
  if (options?.hasConflictingSources) {
    totalPenalty += CONFIDENCE_PENALTIES.CONFLICTING_SOURCES;
  }

  const finalScore = clampedInitial - totalPenalty;

  // Clamp between 0 and 100
  return Math.round(Math.max(0, Math.min(100, finalScore)));
}

/**
 * Calculates confidence score automatically from an array of Evidence objects
 * and conflict status.
 */
export function calculateConfidenceFromEvidence(
  initialConfidence: number,
  evidence: Evidence[],
  conflictFound: boolean
): number {
  const isSingleSource = evidence.length === 1;
  const hasUndatedSource = evidence.some((e) => e.published_date === null);
  const hasConflictingSources = conflictFound;

  return calculateConfidenceScore(initialConfidence, {
    isSingleSource,
    hasUndatedSource,
    hasConflictingSources,
  });
}

/**
 * Builds and returns a complete ClaimScore object strictly conforming to
 * the shared ClaimScore schema in shared/schemas.ts.
 */
export function buildClaimScore(
  claimId: string,
  status: string,
  initialConfidence: number,
  options?: ConfidenceOptions
): ClaimScore {
  const freshnessScore = calculateClaimFreshnessScore(status);
  const confidence = calculateConfidenceScore(initialConfidence, options);

  return ClaimScore.parse({
    claim_id: claimId,
    freshness_score: freshnessScore,
    confidence: confidence,
  });
}

/**
 * Builds a ClaimScore object directly from evidence items and conflict flag,
 * validating output with the shared ClaimScore schema.
 */
export function buildClaimScoreFromEvidence(
  claimId: string,
  status: string,
  initialConfidence: number,
  evidence: Evidence[],
  conflictFound: boolean
): ClaimScore {
  const freshnessScore = calculateClaimFreshnessScore(status);
  const confidence = calculateConfidenceFromEvidence(initialConfidence, evidence, conflictFound);

  return ClaimScore.parse({
    claim_id: claimId,
    freshness_score: freshnessScore,
    confidence: confidence,
  });
}
