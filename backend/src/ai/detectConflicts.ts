import "dotenv/config";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { callLLM } from "../../../shared/llm";
import {
  Claim,
  ConflictLLMOutput,
  ConflictResult,
  Evidence,
  SourceStance,
  Verdict,
} from "../../../shared/schemas";

type VerdictType = z.infer<typeof Verdict>;

function loadDetectConflictsPrompt(): string {
  const candidatePaths = [
    path.resolve(__dirname, "../../prompts/detect-conflicts.md"),
    path.resolve(process.cwd(), "backend/prompts/detect-conflicts.md"),
    path.resolve(process.cwd(), "prompts/detect-conflicts.md"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, "utf-8");
    }
  }

  throw new Error(`Detect conflicts prompt not found. Checked: ${candidatePaths.join(", ")}`);
}

/**
 * Normalizes quotes to ensure they are under 15 words and present in the snippet.
 */
function sanitizeQuote(rawQuote: string, snippet: string): string {
  const trimmed = rawQuote.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  if (trimmed && wordCount <= 15 && snippet.includes(trimmed)) {
    return trimmed;
  }

  // Fallback: first 14 words of the snippet
  const snippetWords = snippet.trim().split(/\s+/);
  return snippetWords.slice(0, 14).join(" ");
}

/**
 * Computes the ConflictResult in code according to strict team rules:
 * - Drops unknown URLs.
 * - Uses published_date from the Evidence item.
 * - Computes verdict, conflict_found, and newest_supporting_date.
 */
export function computeConflictVerdict(
  rawStances: SourceStance[],
  evidenceList: Evidence[],
  claimId: string
): ConflictResult {
  const evidenceMap = new Map<string, Evidence>();
  for (const ev of evidenceList) {
    evidenceMap.set(ev.url, ev);
  }

  // Enforce code rules: known URL, snippet-grounded quote, evidence source_date
  const sanitizedStances: SourceStance[] = [];
  for (const st of rawStances) {
    const evidenceItem = evidenceMap.get(st.url);
    if (!evidenceItem) {
      continue; // Drop stances with unknown URLs
    }

    sanitizedStances.push({
      url: st.url,
      stance: st.stance,
      quote: sanitizeQuote(st.quote, evidenceItem.snippet),
      reason: st.reason,
      source_date: evidenceItem.published_date, // strictly from evidence, never LLM
    });
  }

  // Filter relevant stances (ignore "unrelated")
  const relevant = sanitizedStances.filter((s) => s.stance !== "unrelated");

  if (relevant.length === 0) {
    return {
      claim_id: claimId,
      stances: sanitizedStances,
      conflict_found: false,
      newest_supporting_date: null,
      verdict: "unverifiable",
    };
  }

  const supporting = relevant.filter((s) => s.stance === "supports");
  const opposing = relevant.filter((s) => s.stance === "contradicts" || s.stance === "outdated");

  // Determine newest supporting date
  let newestSupportingDate: string | null = null;
  for (const s of supporting) {
    if (s.source_date) {
      if (!newestSupportingDate || s.source_date > newestSupportingDate) {
        newestSupportingDate = s.source_date;
      }
    }
  }

  // Determine newest opposing date
  let newestOpposingDate: string | null = null;
  for (const s of opposing) {
    if (s.source_date) {
      if (!newestOpposingDate || s.source_date > newestOpposingDate) {
        newestOpposingDate = s.source_date;
      }
    }
  }

  let verdict: VerdictType;
  let conflictFound = false;

  if (supporting.length > 0 && opposing.length === 0) {
    // Only supports
    verdict = "current";
    conflictFound = false;
  } else if (supporting.length === 0 && opposing.length > 0) {
    // Only contradicts / outdated
    verdict = "outdated";
    conflictFound = false;
  } else {
    // Both present
    conflictFound = true;
    if (!newestSupportingDate || !newestOpposingDate) {
      // Missing date on either side makes resolution impossible
      verdict = "disputed";
    } else if (newestSupportingDate === newestOpposingDate) {
      verdict = "disputed";
    } else if (newestSupportingDate > newestOpposingDate) {
      verdict = "current";
    } else {
      verdict = "outdated";
    }
  }

  return {
    claim_id: claimId,
    stances: sanitizedStances,
    conflict_found: conflictFound,
    newest_supporting_date: newestSupportingDate,
    verdict,
  };
}

/**
 * Evaluates conflict and stances for a single claim with its evidence.
 */
export async function detectConflicts(
  claim: Claim,
  evidence: Evidence[]
): Promise<ConflictResult> {
  if (evidence.length === 0) {
    return {
      claim_id: claim.id,
      stances: [],
      conflict_found: false,
      newest_supporting_date: null,
      verdict: "unverifiable",
    };
  }

  const promptSystem = loadDetectConflictsPrompt();
  const inputData = {
    claim: {
      id: claim.id,
      text: claim.text,
      type: claim.type,
      entity: claim.entity,
    },
    evidence: evidence.map((e) => ({
      url: e.url,
      title: e.title,
      snippet: e.snippet,
      published_date: e.published_date,
    })),
  };

  const output = await callLLM({
    system: promptSystem,
    prompt: JSON.stringify(inputData),
    schema: ConflictLLMOutput,
  });

  return computeConflictVerdict(output.stances, evidence, claim.id);
}

/**
 * Runs conflict detection across multiple claims in parallel with custom concurrency = 4.
 * Gracefully defaults any individual claim failure to "unverifiable".
 */
export async function detectConflictsForAll(
  claims: Claim[],
  evidenceByClaimId: Record<string, Evidence[]>,
  concurrency = 4,
  conflictDetector: (claim: Claim, evidence: Evidence[]) => Promise<ConflictResult> = detectConflicts
): Promise<ConflictResult[]> {
  const results: ConflictResult[] = new Array(claims.length);
  let currentIndex = 0;

  async function worker(): Promise<void> {
    while (currentIndex < claims.length) {
      const idx = currentIndex++;
      const claim = claims[idx];
      const evidence = evidenceByClaimId[claim.id] ?? [];
      try {
        results[idx] = await conflictDetector(claim, evidence);
      } catch (err) {
        results[idx] = {
          claim_id: claim.id,
          stances: [],
          conflict_found: false,
          newest_supporting_date: null,
          verdict: "unverifiable",
        };
      }
    }
  }

  const workerCount = Math.min(concurrency, Math.max(claims.length, 1));
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  return results;
}
