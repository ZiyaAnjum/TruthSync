import "dotenv/config";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { callLLM } from "../../../shared/llm";
import {
  Claim,
  ConflictResult,
  ExpiryPrediction,
  Risk,
  RiskOutput,
  Severity,
} from "../../../shared/schemas";

type SeverityType = z.infer<typeof Severity>;

function loadDetectRisksPrompt(): string {
  const candidatePaths = [
    path.resolve(__dirname, "../../prompts/detect-risks.md"),
    path.resolve(process.cwd(), "backend/prompts/detect-risks.md"),
    path.resolve(process.cwd(), "prompts/detect-risks.md"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, "utf-8");
    }
  }

  throw new Error(`Detect risks prompt not found. Checked: ${candidatePaths.join(", ")}`);
}

/**
 * Checks if every claim is current and none is near expiry (or highly volatile).
 * If true, LLM call can be safely skipped and empty risks returned.
 */
export function shouldSkipRiskDetection(
  claimReports: { claim: Claim; conflict: ConflictResult; expiry: ExpiryPrediction }[]
): boolean {
  if (claimReports.length === 0) {
    return true;
  }

  return claimReports.every((cr) => {
    const isCurrent = cr.conflict.verdict === "current" && !cr.conflict.conflict_found;
    const isNotNearExpiry =
      cr.expiry.volatility_class !== "realtime" &&
      cr.expiry.volatility_class !== "fast" &&
      (cr.expiry.recheck_after_days === null || cr.expiry.recheck_after_days > 7);
    return isCurrent && isNotNearExpiry;
  });
}

const SEVERITY_ORDER: Record<SeverityType, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Post-processes risks in code:
 * - Drops invalid affected_claim_ids.
 * - Drops risks with zero remaining valid claim IDs.
 * - Sorts by severity (high first).
 * - Caps at 5 risks.
 * - Re-numbers IDs sequentially as r1, r2, ...
 */
export function postProcessRisks(rawRisks: Risk[], validClaimIds: Set<string>): Risk[] {
  const filteredRisks: Risk[] = [];

  for (const risk of rawRisks) {
    // Filter to only existing valid claim IDs
    const validAffected = Array.from(
      new Set(risk.affected_claim_ids.filter((id) => validClaimIds.has(id)))
    );

    if (validAffected.length === 0) {
      continue; // A risk with no valid claim is invalid per contract
    }

    filteredRisks.push({
      ...risk,
      affected_claim_ids: validAffected,
    });
  }

  // Sort by severity (high -> medium -> low)
  filteredRisks.sort((a, b) => {
    return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
  });

  // Cap at 5 and re-number IDs
  return filteredRisks.slice(0, 5).map((risk, index) => ({
    ...risk,
    id: `r${index + 1}`,
  }));
}

/**
 * Identifies hidden risks in an answer based on claims, conflict results, and expiry predictions.
 */
export async function detectRisks(
  answerText: string,
  claimReports: { claim: Claim; conflict: ConflictResult; expiry: ExpiryPrediction }[]
): Promise<Risk[]> {
  if (shouldSkipRiskDetection(claimReports)) {
    return [];
  }

  const promptSystem = loadDetectRisksPrompt();
  const validClaimIds = new Set(claimReports.map((cr) => cr.claim.id));

  const inputPayload = {
    answer_text: answerText,
    claim_reports: claimReports.map((cr) => ({
      claim_id: cr.claim.id,
      claim_text: cr.claim.text,
      type: cr.claim.type,
      entity: cr.claim.entity,
      verdict: cr.conflict.verdict,
      conflict_found: cr.conflict.conflict_found,
      volatility: cr.expiry.volatility_class,
      recheck_after_days: cr.expiry.recheck_after_days,
      stances_summary: cr.conflict.stances.map((s) => ({
        url: s.url,
        stance: s.stance,
        quote: s.quote,
        source_date: s.source_date,
      })),
    })),
  };

  const output = await callLLM({
    system: promptSystem,
    prompt: JSON.stringify(inputPayload),
    schema: RiskOutput,
  });

  return postProcessRisks(output.risks, validClaimIds);
}
