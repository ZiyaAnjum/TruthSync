import "../preload";
import { callLLM } from "../../../shared/llm";
import type { ClaimReportLike } from "../ai";
import {
  AnalyzeRequest,
  Report,
  Claim,
  Evidence,
  ExpiryPrediction,
  ConflictResult,
  Risk,
  Correction,
  ClaimReport,
} from "../../../shared/schemas";
import { searchEvidence } from "./evidenceService";
import {
  calculateClaimFreshnessScore,
  calculateConfidenceFromEvidence,
  calculateOverallFreshnessScore,
} from "./scoringService";
import {
  updateVerification,
  saveReport,
} from "../db/verificationRepository";

export { callLLM };

/**
 * Custom error thrown when the pipeline halts because required AI services
 * from Member C (claims, expiry, conflicts, risks, corrections) are pending implementation.
 */
export class PipelinePendingDependencyError extends Error {
  public missingServices: string[];

  constructor(missingServices: string[]) {
    super(
      `Verification pipeline paused: Waiting for Member C's services to be integrated: [${missingServices.join(", ")}].`
    );
    this.name = "PipelinePendingDependencyError";
    this.missingServices = missingServices;
  }
}

/**
 * Pluggable service providers for the verification pipeline.
 * B provides evidenceRetriever and scoring; C will provide AI verification services.
 */
export interface PipelineServices {
  claimExtractor?: (answerText: string) => Promise<Claim[]>;
  evidenceRetriever?: (claimId: string, query: string) => Promise<Evidence[]>;
  expiryPredictor?: (claims: Claim[]) => Promise<ExpiryPrediction[]>;
  conflictDetector?: (claim: Claim, evidence: Evidence[]) => Promise<ConflictResult>;
  riskDetector?: (
    answerText: string,
    claimReports: { claim: Claim; conflict: ConflictResult; expiry: ExpiryPrediction }[]
  ) => Promise<Risk[]>;
  correctionEngine?: (
    originalText: string,
    claimReports: ClaimReportLike[]
  ) => Promise<Correction | null>;
}

// Global registry for pipeline services (allows C to register implementations at runtime)
let registeredServices: Partial<PipelineServices> = {};

export function registerPipelineService<K extends keyof PipelineServices>(
  name: K,
  impl: PipelineServices[K]
): void {
  registeredServices[name] = impl;
}

export function clearRegisteredServices(): void {
  registeredServices = {};
}

export function getRegisteredServices(): Partial<PipelineServices> {
  return { ...registeredServices };
}

/**
 * Executes the full verification pipeline step-by-step:
 * 1. queued -> 2. extracting_claims (C) -> 3. retrieving_evidence (B)
 * -> 4. predicting_expiry (C) -> 5. detecting_conflicts (C)
 * -> 6. detecting_risks (C) -> 7. correcting (C) -> 8. scoring (B) -> done
 */
export async function runVerificationPipeline(
  verificationId: string,
  answerText: string,
  customServices?: Partial<PipelineServices>
): Promise<Report> {
  // Validate request text
  const validated = AnalyzeRequest.parse({ answer_text: answerText });

  const services: PipelineServices = {
    evidenceRetriever: searchEvidence,
    ...registeredServices,
    ...customServices,
  };

  // Step 1: Queued
  await updateVerification(verificationId, {
    status: "queued",
  });

  // Check if Member C's claim extraction service is available
  if (!services.claimExtractor) {
    const missing = ["Claim Extractor (C-01)"];
    await updateVerification(verificationId, {
      status: "failed",
      error: `Pending dependencies: ${missing.join(", ")}`,
    });
    throw new PipelinePendingDependencyError(missing);
  }

  // Step 2: Extracting Claims (C-01)
  await updateVerification(verificationId, {
    status: "extracting_claims",
  });

  const claims = await services.claimExtractor(validated.answer_text);

  // If no claims found, return an empty report safely
  if (!claims || claims.length === 0) {
    const emptyReport: Report = {
      id: verificationId,
      schema_version: "1.0.0",
      created_at: new Date().toISOString(),
      answer_text: validated.answer_text,
      overall_freshness_score: 0,
      claims: [],
      risks: [],
      correction: null,
    };

    const validatedReport = Report.parse(emptyReport);
    await saveReport(verificationId, validatedReport);
    return validatedReport;
  }

  // Step 3: Retrieving Evidence in parallel for all checkable claims (B-04)
  await updateVerification(verificationId, {
    status: "retrieving_evidence",
  });

  const retriever = services.evidenceRetriever || searchEvidence;
  const evidenceMap = new Map<string, Evidence[]>();

  // Run searches in parallel
  const evidencePromises = claims.map(async (claim) => {
    if (!claim.checkable) {
      evidenceMap.set(claim.id, []);
      return;
    }

    try {
      const query = claim.entity && !claim.text.toLowerCase().includes(claim.entity.toLowerCase())
        ? `${claim.entity} ${claim.text}`
        : claim.text;
      const evidence = await retriever(claim.id, query);
      evidenceMap.set(claim.id, evidence);
    } catch (err) {
      console.warn(`[Pipeline] Evidence retrieval failed for claim ${claim.id}:`, (err as Error).message);
      // Per PRD: single failing source fetch must never crash the entire report
      evidenceMap.set(claim.id, []);
    }
  });

  await Promise.all(evidencePromises);

  // Check for remaining Member C dependencies
  const missingCComponents: string[] = [];
  if (!services.expiryPredictor) missingCComponents.push("Fact Expiry Predictor (C-02)");
  if (!services.conflictDetector) missingCComponents.push("Source Conflict Detective (C-03)");
  if (!services.riskDetector) missingCComponents.push("Hidden Risk Detector (C-04)");
  if (!services.correctionEngine) missingCComponents.push("Minimal Correction Engine (C-05)");

  if (missingCComponents.length > 0) {
    await updateVerification(verificationId, {
      status: "failed",
      error: `Pending dependencies: ${missingCComponents.join(", ")}`,
    });
    throw new PipelinePendingDependencyError(missingCComponents);
  }

  // Step 4: Predicting Expiry (C-02)
  await updateVerification(verificationId, {
    status: "predicting_expiry",
  });
  const expiryPredictions = await services.expiryPredictor!(claims);
  const expiryMap = new Map(expiryPredictions.map((e) => [e.claim_id, e]));

  // Step 5: Detecting Conflicts (C-03)
  await updateVerification(verificationId, {
    status: "detecting_conflicts",
  });
  const conflictPromises = claims.map(async (claim) => {
    const claimEvidence = evidenceMap.get(claim.id) || [];
    const conflict = await services.conflictDetector!(claim, claimEvidence);
    return conflict;
  });
  const conflicts = await Promise.all(conflictPromises);
  const conflictMap = new Map(conflicts.map((c) => [c.claim_id, c]));

  // Intermediate claim reports for risk and correction engines (C-04, C-05)
  const intermediateReports = claims.map((claim) => ({
    claim,
    conflict: conflictMap.get(claim.id)!,
    expiry: expiryMap.get(claim.id)!,
    evidence: evidenceMap.get(claim.id) || [],
  }));

  // Step 6: Detecting Risks (C-04)
  await updateVerification(verificationId, {
    status: "detecting_risks",
  });
  const risks = await services.riskDetector!(validated.answer_text, intermediateReports);

  // Step 7: Generating Minimal Correction (C-05)
  await updateVerification(verificationId, {
    status: "correcting",
  });
  const correction = await services.correctionEngine!(validated.answer_text, intermediateReports);

  // Step 8: Scoring (B-05) & Assembly of Truth Passport per claim
  const claimReports: ClaimReport[] = claims.map((claim) => {
    const claimEvidence = evidenceMap.get(claim.id) || [];
    const conflict = conflictMap.get(claim.id)!;
    const expiry = expiryMap.get(claim.id)!;

    // Freshness and confidence calculated strictly in code (B-05)
    const freshnessScore = calculateClaimFreshnessScore(conflict.verdict);
    // Baseline initial confidence (defaults to 90 if not estimated by model)
    const initialConfidence = 90;
    const confidenceScore = calculateConfidenceFromEvidence(
      initialConfidence,
      claimEvidence,
      conflict.conflict_found
    );

    return {
      claim,
      expiry,
      evidence: claimEvidence,
      conflict,
      score: {
        claim_id: claim.id,
        freshness_score: freshnessScore,
        confidence: confidenceScore,
      },
    };
  });

  // Overall freshness score computed across all claim verdicts (B-05)
  const overallFreshness = calculateOverallFreshnessScore(
    conflicts.map((c) => c.verdict)
  );

  // Final Report strictly validated against shared schema (Report)
  const finalReport: Report = {
    id: verificationId,
    schema_version: "1.0.0",
    created_at: new Date().toISOString(),
    answer_text: validated.answer_text,
    overall_freshness_score: overallFreshness,
    claims: claimReports,
    risks: risks || [],
    correction: correction || null,
  };

  const validatedReport = Report.parse(finalReport);

  // Save final report to repository and mark done
  await saveReport(verificationId, validatedReport);

  return validatedReport;
}
