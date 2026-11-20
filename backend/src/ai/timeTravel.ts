import "dotenv/config";
import { z } from "zod";
import { detectConflicts } from "./detectConflicts";
import { TimeTravelResult } from "./types.p1";
import { Claim, ConflictResult, Evidence, Verdict } from "../../../shared/schemas";

type VerdictType = z.infer<typeof Verdict>;

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function buildExplanation(
  asOfDate: string,
  verdictThen: VerdictType,
  verdictNow: VerdictType,
  wasTrueThen: boolean | null
): string {
  if (verdictThen === "unverifiable") {
    return `There is no verifiable evidence dated on or before ${asOfDate} to evaluate the claim at that historical date. Current verdict: ${verdictNow}.`;
  }

  if (wasTrueThen === true && verdictNow === "outdated") {
    return `As of ${asOfDate}, the claim was supported and considered current. However, newer evidence confirms that it has since become outdated.`;
  }

  if (wasTrueThen === true && verdictNow === "current") {
    return `As of ${asOfDate}, the claim was verified and current, and it remains fully current and supported today.`;
  }

  if (wasTrueThen === false) {
    return `As of ${asOfDate}, the claim was already contradicted or outdated based on evidence published prior to that date. Current status: ${verdictNow}.`;
  }

  return `As of ${asOfDate}, the historical verdict was ${verdictThen}. Today, the current verdict is ${verdictNow}.`;
}

/**
 * Reconstructs the veracity of a claim at a specific historical point in time (asOfDate)
 * compared against its current standing today using archived and current evidence.
 */
export async function timeTravelVerify(
  claim: Claim,
  archivedEvidence: Evidence[],
  currentEvidence: Evidence[],
  asOfDate: string,
  now: Date = new Date(),
  conflictDetector: (claim: Claim, evidence: Evidence[]) => Promise<ConflictResult> = detectConflicts
): Promise<TimeTravelResult> {
  // 1. Validate asOfDate format and ensure it is not in the future
  if (!ISO_DATE_REGEX.test(asOfDate)) {
    throw new Error(`Invalid asOfDate format: "${asOfDate}". Expected YYYY-MM-DD.`);
  }

  const todayIso = now.toISOString().slice(0, 10);
  if (asOfDate > todayIso) {
    throw new Error(`asOfDate "${asOfDate}" cannot be in the future relative to today (${todayIso}).`);
  }

  // 2. Filter archivedEvidence to published_date <= asOfDate.
  // Explicitly exclude evidence with missing published_date (null/undefined) or date in the future of asOfDate.
  const filteredArchived = archivedEvidence.filter(
    (e) => e.published_date !== null && e.published_date !== undefined && e.published_date <= asOfDate
  );

  // 3. Determine historical verdict (verdict_then)
  let verdictThen: VerdictType = "unverifiable";
  let wasTrueThen: boolean | null = null;

  if (filteredArchived.length > 0) {
    const historicalConflict = await conflictDetector(claim, filteredArchived);
    verdictThen = historicalConflict.verdict;

    // Guard against future-leakage in historical stance evaluation:
    // If an LLM detector returns "outdated" on pre-asOfDate evidence because the LLM
    // evaluates against today's world knowledge, check if there is any newer contradicting
    // evidence within filteredArchived (published on or before asOfDate).
    // If no pre-asOfDate evidence contradicts the claim, the fact was current as of asOfDate.
    if (verdictThen === "outdated") {
      const opposingStances = historicalConflict.stances.filter(
        (s) => s.stance === "contradicts" || s.stance === "outdated"
      );
      const supportingStances = historicalConflict.stances.filter(
        (s) => s.stance === "supports"
      );

      const hasPreDateContradiction = opposingStances.some((opp) => {
        if (!opp.source_date) return false;
        return supportingStances.some(
          (sup) => sup.source_date && opp.source_date! > sup.source_date
        );
      });

      if (!hasPreDateContradiction && supportingStances.length === 0 && opposingStances.length > 0) {
        // The only pre-asOfDate sources reported the fact, but were tagged "outdated" due to post-asOfDate events.
        verdictThen = "current";
      }
    }

    if (verdictThen === "current") {
      wasTrueThen = true;
    } else if (verdictThen === "outdated") {
      wasTrueThen = false;
    } else {
      wasTrueThen = null;
    }
  }

  // 4. Determine present verdict (verdict_now)
  let verdictNow: VerdictType = "unverifiable";
  if (currentEvidence.length > 0) {
    const presentConflict = await conflictDetector(claim, currentEvidence);
    verdictNow = presentConflict.verdict;
  }

  // 5. Aggregate evidence used strictly for the historical verdict (never post-asOfDate URLs)
  const evidenceUsed = Array.from(new Set(filteredArchived.map((e) => e.url)));

  const explanation = buildExplanation(asOfDate, verdictThen, verdictNow, wasTrueThen);

  return {
    claim_id: claim.id,
    as_of_date: asOfDate,
    verdict_then: verdictThen,
    verdict_now: verdictNow,
    was_true_then: wasTrueThen,
    explanation,
    evidence_used: evidenceUsed,
  };
}
