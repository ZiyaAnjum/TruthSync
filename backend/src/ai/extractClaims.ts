import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load backend/.env via dotenv before anything else
const envCandidates = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(process.cwd(), "backend/.env"),
  path.resolve(process.cwd(), ".env"),
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}
dotenv.config();

import { callLLM } from "../../../shared/llm";
import {
  AnalyzeRequest,
  Claim,
  ExtractClaimsOutput,
} from "../../../shared/schemas";

/**
 * Loads the system prompt markdown file for claim extraction.
 */
function loadExtractClaimsPrompt(): string {
  const candidatePaths = [
    path.resolve(__dirname, "../../prompts/extract-claims.md"),
    path.resolve(process.cwd(), "backend/prompts/extract-claims.md"),
    path.resolve(process.cwd(), "prompts/extract-claims.md"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, "utf-8");
    }
  }

  throw new Error(
    `Claim extraction prompt not found. Checked: ${candidatePaths.join(", ")}`
  );
}

/**
 * Post-processes raw claims from LLM:
 * - Drops claims with empty text
 * - Drops duplicates (case-insensitive text match)
 * - Verifies/fixes original_sentence against input text (drops if not found)
 * - Re-numbers IDs sequentially (c1, c2, ...) and caps output at 10 claims
 */
export function postProcessClaims(rawClaims: Claim[], answerText: string): Claim[] {
  const seenTexts = new Set<string>();
  const validClaims: Claim[] = [];

  // Break input text into candidate sentences for sentence fallback matching
  const sentences = answerText
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const claim of rawClaims) {
    // 1. Drop claims with empty text
    const text = claim.text ? claim.text.trim() : "";
    if (!text) {
      continue;
    }

    // 2. Drop duplicates (case-insensitive text match)
    const normalizedText = text.toLowerCase();
    if (seenTexts.has(normalizedText)) {
      continue;
    }

    // 3. Verify that original_sentence really appears in the input text
    let origSentence = claim.original_sentence ? claim.original_sentence.trim() : "";
    let matchedSentence: string | null = null;

    if (origSentence && answerText.includes(origSentence)) {
      matchedSentence = origSentence;
    } else if (origSentence) {
      // Case-insensitive search inside the answer text
      const lowerAnswer = answerText.toLowerCase();
      const lowerOrig = origSentence.toLowerCase();
      const idx = lowerAnswer.indexOf(lowerOrig);
      if (idx !== -1) {
        matchedSentence = answerText.slice(idx, idx + origSentence.length);
      }
    }

    // Fallback: locate the sentence containing the claim text or entity
    if (!matchedSentence) {
      const foundSentence = sentences.find(
        (s) =>
          s.toLowerCase().includes(text.toLowerCase()) ||
          (claim.entity && s.toLowerCase().includes(claim.entity.toLowerCase()))
      );
      if (foundSentence) {
        matchedSentence = foundSentence;
      }
    }

    // If original_sentence cannot be found or reconciled, drop the claim
    if (!matchedSentence) {
      continue;
    }

    seenTexts.add(normalizedText);
    validClaims.push({
      ...claim,
      text,
      original_sentence: matchedSentence,
    });
  }

  // 4. Cap at 10 claims and re-number IDs sequentially as c1, c2, ...
  return validClaims.slice(0, 10).map((claim, index) => ({
    ...claim,
    id: `c${index + 1}`,
  }));
}

/**
 * Extracts atomic, verifiable factual claims from an AI answer.
 * Validates input, calls LLM, post-processes claims, and lets LLMError propagate.
 */
export async function extractClaims(answerText: string): Promise<Claim[]> {
  // Validate input bounds (1 to MAX_ANSWER_CHARS)
  const validated = AnalyzeRequest.parse({ answer_text: answerText });

  const systemPrompt = loadExtractClaimsPrompt();

  const output = await callLLM({
    system: systemPrompt,
    prompt: JSON.stringify({ answer_text: validated.answer_text }),
    schema: ExtractClaimsOutput,
  });

  return postProcessClaims(output.claims, validated.answer_text);
}
