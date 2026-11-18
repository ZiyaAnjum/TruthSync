// shared/schemas.ts
// SINGLE SOURCE OF TRUTH for every JSON shape in TruthLens.
// Owner: Member C. Do NOT edit without telling the whole team (bump SCHEMA_VERSION).
// Dates are always "YYYY-MM-DD" strings. Scores are always numbers 0-100.
import { z } from "zod";

export const SCHEMA_VERSION = "1.0.0";
export const MAX_ANSWER_CHARS = 5000; // TBD: confirm against FR-01 in the PRD

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD");
const score = z.number().min(0).max(100);

// ---------- Enums ----------
export const ClaimType = z.enum(["number", "date", "person_role", "policy", "product", "event", "other"]);
export const VolatilityClass = z.enum(["static", "slow", "medium", "fast", "realtime"]);
export const Stance = z.enum(["supports", "contradicts", "outdated", "unrelated"]);
export const Verdict = z.enum(["current", "outdated", "disputed", "unverifiable"]);
export const Severity = z.enum(["low", "medium", "high"]);
export const Stage = z.enum([
  "queued", "extracting_claims", "predicting_expiry", "retrieving_evidence",
  "detecting_conflicts", "detecting_risks", "correcting", "done", "failed", "cancelled",
]);

// ---------- API request (A -> B) ----------
export const AnalyzeRequest = z.object({
  answer_text: z.string().min(1).max(MAX_ANSWER_CHARS),
});

// ---------- C-01 Claim extraction ----------
export const Claim = z.object({
  id: z.string(),                    // "c1", "c2", ...
  text: z.string().min(1),           // one atomic, checkable fact
  type: ClaimType,
  entity: z.string(),                // main subject, e.g. "Prime Minister of UK"
  original_sentence: z.string(),     // sentence in the AI answer it came from
  checkable: z.boolean(),
});
export const ExtractClaimsOutput = z.object({ claims: z.array(Claim) });

// ---------- B-04 Evidence (B -> C) ----------
export const Evidence = z.object({
  claim_id: z.string(),
  url: z.string().url(),
  title: z.string(),
  snippet: z.string(),
  published_date: isoDate.nullable(), // null if unknown
  retrieved_at: z.string(),           // ISO datetime
});

// ---------- C-02 Fact Expiry Predictor ----------
export const ExpiryPrediction = z.object({
  claim_id: z.string(),
  volatility_class: VolatilityClass,
  reason: z.string(),
  recheck_after_days: z.number().int().nonnegative().nullable(), // null for static
  expires_on: isoDate.nullable(),                                // computed in CODE, not by LLM
});
// What the LLM is allowed to return (class + reason only):
export const ExpiryLLMOutput = z.object({
  predictions: z.array(z.object({
    claim_id: z.string(),
    volatility_class: VolatilityClass,
    reason: z.string(),
  })),
});

// ---------- C-03 Source Conflict Detective ----------
export const SourceStance = z.object({
  url: z.string(),
  stance: Stance,
  quote: z.string(),                  // under 15 words
  reason: z.string(),
  source_date: isoDate.nullable(),
});
export const ConflictLLMOutput = z.object({ stances: z.array(SourceStance) });
export const ConflictResult = z.object({
  claim_id: z.string(),
  stances: z.array(SourceStance),
  conflict_found: z.boolean(),
  newest_supporting_date: isoDate.nullable(),
  verdict: Verdict,
});

// ---------- B-05 Scores (computed in code by B, never by LLM) ----------
export const ClaimScore = z.object({
  claim_id: z.string(),
  freshness_score: score,
  confidence: score,
});

// ---------- C-04 Hidden Risk Detector ----------
export const Risk = z.object({
  id: z.string(),
  severity: Severity,
  description: z.string(),
  affected_claim_ids: z.array(z.string()).min(1), // a risk with no claim is invalid
});
export const RiskOutput = z.object({ risks: z.array(Risk) });

// ---------- C-05 Minimal Correction Engine ----------
export const Change = z.object({
  claim_id: z.string(),
  original_span: z.string(),
  new_span: z.string(),
  source_url: z.string(),
});
export const Correction = z.object({
  corrected_text: z.string(),
  changes: z.array(Change),
});

// ---------- Truth Passport: everything about one claim (A-05) ----------
export const ClaimReport = z.object({
  claim: Claim,
  expiry: ExpiryPrediction,
  evidence: z.array(Evidence),
  conflict: ConflictResult,
  score: ClaimScore,
});

// ---------- Final report (B -> A) ----------
export const Report = z.object({
  id: z.string(),
  schema_version: z.string(),
  created_at: z.string(),
  answer_text: z.string(),
  overall_freshness_score: score,
  claims: z.array(ClaimReport),
  risks: z.array(Risk),
  correction: Correction.nullable(),  // null if nothing needed fixing
});

// ---------- Progress + errors (A-03) ----------
export const AnalysisStatus = z.object({
  id: z.string(),
  stage: Stage,
  percent: score,
  error: z.string().nullable(),
});
export const ApiError = z.object({
  error: z.object({
    code: z.enum(["VALIDATION", "RATE_LIMIT", "TIMEOUT", "LLM_FAILED", "SEARCH_FAILED", "NOT_FOUND", "INTERNAL"]),
    message: z.string(),            // safe to show the user
  }),
});

// ---------- P1 (build later) ----------
export const TimelineEvent = z.object({
  claim_id: z.string(),
  date: isoDate,
  event: z.string(),
  source_url: z.string(),
});

// ---------- Types ----------
export type Claim = z.infer<typeof Claim>;
export type Evidence = z.infer<typeof Evidence>;
export type ExpiryPrediction = z.infer<typeof ExpiryPrediction>;
export type SourceStance = z.infer<typeof SourceStance>;
export type ConflictResult = z.infer<typeof ConflictResult>;
export type ClaimScore = z.infer<typeof ClaimScore>;
export type Risk = z.infer<typeof Risk>;
export type Correction = z.infer<typeof Correction>;
export type ClaimReport = z.infer<typeof ClaimReport>;
export type Report = z.infer<typeof Report>;
export type AnalysisStatus = z.infer<typeof AnalysisStatus>;
export type ApiError = z.infer<typeof ApiError>;