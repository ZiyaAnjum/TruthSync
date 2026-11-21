import { registerPipelineService } from "./pipelineService";
import {
  extractClaims,
  predictExpiry,
  detectConflicts,
  detectRisks,
  correctAnswer,
} from "../ai";

/**
 * Registers default AI verification services implemented by Member C (C-01 to C-08)
 * into the pipelineService registry.
 */
export function registerDefaultAiServices(): void {
  registerPipelineService("claimExtractor", extractClaims);
  registerPipelineService("expiryPredictor", predictExpiry);
  registerPipelineService("conflictDetector", detectConflicts);
  registerPipelineService("riskDetector", detectRisks);
  registerPipelineService("correctionEngine", correctAnswer);
}
