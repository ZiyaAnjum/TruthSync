import "../preload";
import {
  calculateOverallFreshnessScore,
  calculateClaimFreshnessScore,
  calculateConfidenceScore,
  calculateConfidenceFromEvidence,
  buildClaimScore,
  buildClaimScoreFromEvidence,
} from "./scoringService";
import { ClaimScore, Evidence } from "../../../shared/schemas";

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

function runTests() {
  console.log("=================================================");
  console.log(" Running Scoring & Confidence Unit Tests (B-05)");
  console.log("=================================================\n");

  // =========================================================
  // Part A: Freshness Score Tests
  // =========================================================
  console.log("--- Part A: Freshness Score Calculations ---");

  // Case 1: All Supported -> 100
  const allSupported = calculateOverallFreshnessScore(["Supported", "Supported", "Supported"]);
  assert(allSupported === 100, `Case 1: All Supported -> expected 100, got ${allSupported}`);

  // Case 2: All Outdated -> 0
  const allOutdated = calculateOverallFreshnessScore(["Outdated", "Outdated"]);
  assert(allOutdated === 0, `Case 2: All Outdated -> expected 0, got ${allOutdated}`);

  // Case 3: Supported + Conflicting -> 75
  const suppConflict = calculateOverallFreshnessScore(["Supported", "Conflicting"]);
  assert(suppConflict === 75, `Case 3: Supported + Conflicting -> expected 75, got ${suppConflict}`);

  // Case 4: Supported + Insufficient Evidence -> 75
  const suppInsuff = calculateOverallFreshnessScore(["Supported", "Insufficient Evidence"]);
  assert(suppInsuff === 75, `Case 4: Supported + Insufficient Evidence -> expected 75, got ${suppInsuff}`);

  // Case 5: Mixed statuses -> correct average
  // Supported (1.0) + Conflicting (0.5) + Insufficient Evidence (0.5) + Outdated (0.0)
  // Average = (1.0 + 0.5 + 0.5 + 0.0) / 4 = 2.0 / 4 = 0.5 * 100 = 50
  const mixed = calculateOverallFreshnessScore([
    "Supported",
    "Conflicting",
    "Insufficient Evidence",
    "Outdated",
  ]);
  assert(mixed === 50, `Case 5: Mixed statuses (1.0 + 0.5 + 0.5 + 0.0) / 4 -> expected 50, got ${mixed}`);

  // Mixed 2: Supported (1.0) + Outdated (0.0) -> 50
  const halfHalf = calculateOverallFreshnessScore(["Supported", "Outdated"]);
  assert(halfHalf === 50, `Mixed 2: Supported + Outdated -> expected 50, got ${halfHalf}`);

  // Case 6: Empty input -> safely handled (returns 0, no division by zero)
  const emptyScore = calculateOverallFreshnessScore([]);
  assert(emptyScore === 0, `Case 6a: Empty array -> expected 0, got ${emptyScore}`);

  const nullScore = calculateOverallFreshnessScore(null as unknown as string[]);
  assert(nullScore === 0, `Case 6b: Null array -> expected 0, got ${nullScore}`);

  // Exclusion of "Not Checked" claims
  // Supported (1.0) + Not Checked (excluded) -> average of 1 claim = 100
  const notCheckedIgnored = calculateOverallFreshnessScore(["Supported", "Not Checked"]);
  assert(notCheckedIgnored === 100, `Case 6c: "Not Checked" excluded from average -> expected 100, got ${notCheckedIgnored}`);

  // Schema Verdict enum values check
  // current (1.0) + disputed (0.5) -> 75
  const schemaVerdicts = calculateOverallFreshnessScore(["current", "disputed"]);
  assert(schemaVerdicts === 75, `Schema enum: current + disputed -> expected 75, got ${schemaVerdicts}`);

  // Single claim freshness
  assert(calculateClaimFreshnessScore("Supported") === 100, "Single claim: Supported -> 100");
  assert(calculateClaimFreshnessScore("current") === 100, "Single claim: current -> 100");
  assert(calculateClaimFreshnessScore("Conflicting") === 50, "Single claim: Conflicting -> 50");
  assert(calculateClaimFreshnessScore("Insufficient Evidence") === 50, "Single claim: Insufficient Evidence -> 50");
  assert(calculateClaimFreshnessScore("Outdated") === 0, "Single claim: Outdated -> 0");
  assert(calculateClaimFreshnessScore("unknown_status") === 0, "Single claim: unknown -> 0");

  // =========================================================
  // Part B: Confidence Score Tests
  // =========================================================
  console.log("\n--- Part B: Confidence Score Calculations ---");

  // Case 1: Initial confidence 90, no penalties -> 90
  const c1 = calculateConfidenceScore(90, {});
  assert(c1 === 90, `Case 1: Initial 90, no penalties -> expected 90, got ${c1}`);

  // Case 2: Initial confidence 90, single source -> 70 (-20)
  const c2 = calculateConfidenceScore(90, { isSingleSource: true });
  assert(c2 === 70, `Case 2: Initial 90, single source (-20) -> expected 70, got ${c2}`);

  // Case 3: Initial confidence 90, undated source -> 75 (-15)
  const c3 = calculateConfidenceScore(90, { hasUndatedSource: true });
  assert(c3 === 75, `Case 3: Initial 90, undated source (-15) -> expected 75, got ${c3}`);

  // Case 4: Initial confidence 90, conflicting sources -> 65 (-25)
  const c4 = calculateConfidenceScore(90, { hasConflictingSources: true });
  assert(c4 === 65, `Case 4: Initial 90, conflicting sources (-25) -> expected 65, got ${c4}`);

  // Case 5: All three penalties (90 - 20 - 15 - 25 = 30) -> 30
  const c5 = calculateConfidenceScore(90, {
    isSingleSource: true,
    hasUndatedSource: true,
    hasConflictingSources: true,
  });
  assert(c5 === 30, `Case 5: Initial 90, all 3 penalties (-60) -> expected 30, got ${c5}`);

  // Case 6: Initial confidence 20, all three penalties -> 0 (never negative)
  const c6 = calculateConfidenceScore(20, {
    isSingleSource: true,
    hasUndatedSource: true,
    hasConflictingSources: true,
  });
  assert(c6 === 0, `Case 6: Initial 20, all 3 penalties -> clamped to 0, got ${c6}`);

  // Case 7: Initial confidence 100, no penalties -> 100
  const c7 = calculateConfidenceScore(100, {});
  assert(c7 === 100, `Case 7: Initial 100, no penalties -> expected 100, got ${c7}`);

  // Boundary condition: Initial confidence > 100 -> clamped to 100
  const cHigh = calculateConfidenceScore(120, {});
  assert(cHigh === 100, `Boundary: Initial 120 clamped to 100 -> got ${cHigh}`);

  // Boundary condition: Initial confidence < 0 -> clamped to 0
  const cLow = calculateConfidenceScore(-10, {});
  assert(cLow === 0, `Boundary: Initial -10 clamped to 0 -> got ${cLow}`);

  // Invalid input handling (NaN / non-number)
  const cNan = calculateConfidenceScore(NaN, {});
  assert(cNan === 0, `Invalid input: NaN -> returns 0, got ${cNan}`);

  // =========================================================
  // Part C: Evidence Object Integration Tests
  // =========================================================
  console.log("\n--- Part C: Calculation From Evidence Items ---");

  const singleDatedEvidence: Evidence[] = [
    {
      claim_id: "claim-1",
      url: "https://example.com/source1",
      title: "Dated Source",
      snippet: "Snippet text",
      published_date: "2026-02-15",
      retrieved_at: "2026-11-19T00:00:00.000Z",
    },
  ];

  // 1 single dated source -> only single source penalty (-20)
  const confSingleDated = calculateConfidenceFromEvidence(85, singleDatedEvidence, false);
  assert(confSingleDated === 65, `Single dated source: 85 - 20 -> expected 65, got ${confSingleDated}`);

  // Multiple sources, one undated -> undated source penalty (-15), no single source penalty
  const multiWithUndatedEvidence: Evidence[] = [
    {
      claim_id: "claim-2",
      url: "https://example.com/source1",
      title: "Dated Source",
      snippet: "Snippet 1",
      published_date: "2026-02-15",
      retrieved_at: "2026-11-19T00:00:00.000Z",
    },
    {
      claim_id: "claim-2",
      url: "https://example.com/source2",
      title: "Undated Source",
      snippet: "Snippet 2",
      published_date: null,
      retrieved_at: "2026-11-19T00:00:00.000Z",
    },
  ];

  const confMultiUndated = calculateConfidenceFromEvidence(85, multiWithUndatedEvidence, false);
  assert(confMultiUndated === 70, `Multi sources with one undated: 85 - 15 -> expected 70, got ${confMultiUndated}`);

  // Multiple sources, two undated -> undated penalty applied ONCE (-15), not twice
  const multiWithTwoUndated: Evidence[] = [
    {
      claim_id: "claim-3",
      url: "https://example.com/source1",
      title: "Undated 1",
      snippet: "Snippet 1",
      published_date: null,
      retrieved_at: "2026-11-19T00:00:00.000Z",
    },
    {
      claim_id: "claim-3",
      url: "https://example.com/source2",
      title: "Undated 2",
      snippet: "Snippet 2",
      published_date: null,
      retrieved_at: "2026-11-19T00:00:00.000Z",
    },
  ];
  const confTwoUndated = calculateConfidenceFromEvidence(85, multiWithTwoUndated, false);
  assert(confTwoUndated === 70, `Multi sources with 2 undated: penalty applied only once -> expected 70, got ${confTwoUndated}`);

  // =========================================================
  // Part D: Shared Schema Validation (ClaimScore)
  // =========================================================
  console.log("\n--- Part D: Shared Schema Adherence (ClaimScore) ---");

  const builtScore = buildClaimScore("c101", "Supported", 90, { isSingleSource: true });
  assert(builtScore.claim_id === "c101", "ClaimScore claim_id matches");
  assert(builtScore.freshness_score === 100, `ClaimScore freshness is 100, got ${builtScore.freshness_score}`);
  assert(builtScore.confidence === 70, `ClaimScore confidence is 70, got ${builtScore.confidence}`);

  // Validate directly against shared schema parser
  const parsedScore = ClaimScore.safeParse(builtScore);
  assert(parsedScore.success, "ClaimScore strictly conforms to shared ClaimScore schema");

  const builtFromEvidence = buildClaimScoreFromEvidence(
    "c102",
    "Conflicting",
    80,
    singleDatedEvidence,
    true
  );
  assert(builtFromEvidence.freshness_score === 50, "ClaimScore from evidence freshness is 50");
  // 80 - 20 (single) - 25 (conflict) = 35
  assert(builtFromEvidence.confidence === 35, `ClaimScore from evidence confidence is 35, got ${builtFromEvidence.confidence}`);
  assert(ClaimScore.safeParse(builtFromEvidence).success, "ClaimScore from evidence strictly validates against shared schema");

  console.log("\n=================================================");
  console.log(` Summary: ${passedTests} passed, ${failedTests} failed.`);
  console.log("=================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
