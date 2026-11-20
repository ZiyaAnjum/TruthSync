import "dotenv/config";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { callLLM } from "../../../shared/llm";
import {
  Change,
  Claim,
  ConflictResult,
  Correction,
  Evidence,
} from "../../../shared/schemas";

type ChangeType = z.infer<typeof Change>;

export interface ClaimReportLike {
  claim: Claim;
  conflict: ConflictResult;
  evidence: Evidence[];
}

const CorrectionLLMOutput = z.object({
  changes: z.array(Change),
});

function loadCorrectAnswerPrompt(): string {
  const candidatePaths = [
    path.resolve(__dirname, "../../prompts/correct-answer.md"),
    path.resolve(process.cwd(), "backend/prompts/correct-answer.md"),
    path.resolve(process.cwd(), "prompts/correct-answer.md"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, "utf-8");
    }
  }

  throw new Error(`Correct answer prompt not found. Checked: ${candidatePaths.join(", ")}`);
}

/**
 * Applies surgical changes to answerText in code:
 * - original_span must appear exactly once in answerText (else dropped).
 * - source_url must match an evidence URL for that claim (else dropped).
 * - Overlapping spans are resolved by keeping the earlier span.
 * - Reconstructs corrected_text in code, ensuring untouched characters remain 100% identical.
 */
export function applyChanges(
  answerText: string,
  rawChanges: ChangeType[],
  claimReports: ClaimReportLike[]
): Correction | null {
  // Build map of valid evidence URLs per claim_id
  const claimUrlMap = new Map<string, Set<string>>();
  for (const cr of claimReports) {
    const urls = new Set(cr.evidence.map((e) => e.url));
    claimUrlMap.set(cr.claim.id, urls);
  }

  interface CandidateSpan {
    change: ChangeType;
    startIndex: number;
    endIndex: number;
  }

  const candidateSpans: CandidateSpan[] = [];

  for (const ch of rawChanges) {
    // 1. Validate that source_url belongs to that claim's evidence
    const validUrls = claimUrlMap.get(ch.claim_id);
    if (!validUrls || !validUrls.has(ch.source_url)) {
      continue;
    }

    // 2. Validate that original_span appears exactly once in answerText
    const firstIdx = answerText.indexOf(ch.original_span);
    if (firstIdx === -1) {
      continue;
    }
    const lastIdx = answerText.lastIndexOf(ch.original_span);
    if (firstIdx !== lastIdx) {
      // Ambiguous: appears multiple times
      continue;
    }

    candidateSpans.push({
      change: ch,
      startIndex: firstIdx,
      endIndex: firstIdx + ch.original_span.length,
    });
  }

  // Sort candidate spans by startIndex ascending
  candidateSpans.sort((a, b) => a.startIndex - b.startIndex);

  // Filter overlapping spans: keep the first (earlier) span
  const nonOverlapping: CandidateSpan[] = [];
  let lastEnd = 0;
  for (const span of candidateSpans) {
    if (span.startIndex >= lastEnd) {
      nonOverlapping.push(span);
      lastEnd = span.endIndex;
    }
  }

  if (nonOverlapping.length === 0) {
    return null;
  }

  // Assemble corrected_text in code byte-for-byte outside replaced spans
  let correctedText = "";
  let cursor = 0;
  const appliedChanges: ChangeType[] = [];

  for (const item of nonOverlapping) {
    correctedText += answerText.slice(cursor, item.startIndex);
    correctedText += item.change.new_span;
    cursor = item.endIndex;
    appliedChanges.push(item.change);
  }
  correctedText += answerText.slice(cursor);

  return {
    corrected_text: correctedText,
    changes: appliedChanges,
  };
}

/**
 * Generates a minimally corrected answer by identifying outdated/disputed claims,
 * querying the LLM for surgical spans, and assembling the corrected text in code.
 */
export async function correctAnswer(
  answerText: string,
  claimReports: ClaimReportLike[]
): Promise<Correction | null> {
  // Only correct if there are outdated or disputed claims
  const claimsNeedingCorrection = claimReports.filter(
    (cr) => cr.conflict.verdict === "outdated" || cr.conflict.verdict === "disputed"
  );

  if (claimsNeedingCorrection.length === 0) {
    return null;
  }

  const promptSystem = loadCorrectAnswerPrompt();
  const inputPayload = {
    answer_text: answerText,
    claims_to_correct: claimsNeedingCorrection.map((cr) => ({
      claim_id: cr.claim.id,
      text: cr.claim.text,
      verdict: cr.conflict.verdict,
      evidence: cr.evidence.map((e) => ({
        url: e.url,
        title: e.title,
        snippet: e.snippet,
        published_date: e.published_date,
      })),
    })),
  };

  const output = await callLLM({
    system: promptSystem,
    prompt: JSON.stringify(inputPayload),
    schema: CorrectionLLMOutput,
  });

  return applyChanges(answerText, output.changes, claimReports);
}
