import "dotenv/config";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { callLLM } from "../../../shared/llm";
import {
  Claim,
  ExpiryLLMOutput,
  ExpiryPrediction,
  VolatilityClass,
} from "../../../shared/schemas";

type VolatilityClassType = z.infer<typeof VolatilityClass>;

/**
 * Recheck interval in days by volatility class (based on PRD FR-05).
 * static = null (no expiry), slow = 180 days, medium = 30 days, fast = 7 days, realtime = 1 day.
 */
export const RECHECK_DAYS: Record<VolatilityClassType, number | null> = {
  static: null,
  slow: 180,
  medium: 30,
  fast: 7,
  realtime: 1,
};

/**
 * Computes an ISO YYYY-MM-DD expiration date string from now + recheck days.
 * Returns null if recheck_after_days is null.
 */
export function computeExpiresOn(now: Date, days: number | null): string | null {
  if (days === null) {
    return null;
  }
  const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
  return target.toISOString().slice(0, 10);
}

function loadPredictExpiryPrompt(): string {
  const candidatePaths = [
    path.resolve(__dirname, "../../prompts/predict-expiry.md"),
    path.resolve(process.cwd(), "backend/prompts/predict-expiry.md"),
    path.resolve(process.cwd(), "prompts/predict-expiry.md"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, "utf-8");
    }
  }

  throw new Error(`Predict expiry prompt not found. Checked: ${candidatePaths.join(", ")}`);
}

/**
 * Merges raw LLM predictions with known claims, defaults missing ones,
 * drops unknown claim_ids, and calculates recheck_after_days + expires_on in code.
 */
export function applyExpiryCalculations(
  rawPredictions: { claim_id: string; volatility_class: VolatilityClassType; reason: string }[],
  claims: Claim[],
  now: Date = new Date()
): ExpiryPrediction[] {
  const validClaimIds = new Set(claims.map((c) => c.id));
  const predictionMap = new Map<string, { volatility_class: VolatilityClassType; reason: string }>();

  for (const pred of rawPredictions) {
    // Drop predictions for unknown claim ids
    if (validClaimIds.has(pred.claim_id)) {
      predictionMap.set(pred.claim_id, {
        volatility_class: pred.volatility_class,
        reason: pred.reason,
      });
    }
  }

  return claims.map((claim) => {
    const found = predictionMap.get(claim.id);
    const volatility_class: VolatilityClassType = found ? found.volatility_class : "medium";
    const reason = found ? found.reason : "Defaulted: classification missing";
    const recheck_after_days = RECHECK_DAYS[volatility_class];
    const expires_on = computeExpiresOn(now, recheck_after_days);

    return {
      claim_id: claim.id,
      volatility_class,
      reason,
      recheck_after_days,
      expires_on,
    };
  });
}

/**
 * Predicts fact expiry and volatility for a list of claims.
 * Sends all claims in a single callLLM call and computes dates in code.
 */
export async function predictExpiry(
  claims: Claim[],
  now: Date = new Date()
): Promise<ExpiryPrediction[]> {
  if (claims.length === 0) {
    return [];
  }

  const promptSystem = loadPredictExpiryPrompt();
  const inputClaims = claims.map((c) => ({
    id: c.id,
    text: c.text,
    type: c.type,
    entity: c.entity,
  }));

  const output = await callLLM({
    system: promptSystem,
    prompt: JSON.stringify({ claims: inputClaims }),
    schema: ExpiryLLMOutput,
  });

  return applyExpiryCalculations(output.predictions, claims, now);
}
