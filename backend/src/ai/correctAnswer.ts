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
 * Normalizes text for grounding comparisons:
 * - Replaces curly single quotes and apostrophes with standard ASCII single quote
 * - Replaces curly double quotes with standard ASCII double quote
 * - Collapses consecutive whitespace into a single space
 * - Trims leading and trailing whitespace
 * - Converts to lowercase
 */
export function normalizeText(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Filters out changes whose new_span:
 * - is empty after trimming
 * - does not appear (case-insensitively, with quote/whitespace normalization) in the cited evidence snippet or title
 */
export function filterGroundedChanges(
  rawChanges: ChangeType[],
  claimReports: ClaimReportLike[]
): ChangeType[] {
  return rawChanges.filter((ch) => {
    const trimmedNewSpan = ch.new_span.trim();
    if (!trimmedNewSpan) {
      return false;
    }

    const report = claimReports.find((r) => r.claim.id === ch.claim_id);
    const ev = report?.evidence.find((e) => e.url === ch.source_url);
    if (!ev) {
      return false;
    }

    const normalizedSource = normalizeText(`${ev.snippet} ${ev.title}`);
    const normalizedNewSpan = normalizeText(trimmedNewSpan);
    return normalizedSource.includes(normalizedNewSpan);
  });
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

  const groundedChanges = filterGroundedChanges(output.changes, claimsNeedingCorrection);

  return applyChanges(answerText, groundedChanges, claimReports);
}
