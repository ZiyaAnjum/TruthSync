import "dotenv/config";
import assert from "node:assert";
import {
  detectRisks,
  postProcessRisks,
  shouldSkipRiskDetection,
} from "./detectRisks";
import { Claim, ConflictResult, ExpiryPrediction, Risk } from "../../../shared/schemas";
import { claimCorrect, claimOutdatedCeo } from "./__fixtures__/evidence";

function runUnitTests(): void {
  console.log("=================================================");
  console.log("Running Unit Tests: detectRisks rules & filters");
  console.log("=================================================");

  const validClaimIds = new Set(["c1", "c2", "c3"]);

  // Test 1: Invalid-id dropping and empty-affected risk dropping
  {
    const rawRisks: Risk[] = [
      {
        id: "raw-1",
        severity: "medium",
        description: "Valid risk with mixed ids",
        affected_claim_ids: ["c1", "c-invalid-99", "c2"],
      },
      {
        id: "raw-2",
        severity: "high",
        description: "Risk with only invalid ids",
        affected_claim_ids: ["c-fake-1", "c-fake-2"],
      },
    ];

    const processed = postProcessRisks(rawRisks, validClaimIds);
    assert.strictEqual(processed.length, 1, "Risk with only invalid IDs must be dropped");
    assert.deepStrictEqual(processed[0].affected_claim_ids, ["c1", "c2"], "Invalid IDs filtered out");
    assert.strictEqual(processed[0].id, "r1", "Re-numbered to r1");
    console.log("✔ Test 1 Passed: Invalid claim IDs dropped and empty-affected risk removed");
  }

  // Test 2: Severity sorting (high -> medium -> low)
  {
    const rawRisks: Risk[] = [
      { id: "1", severity: "low", description: "Low risk", affected_claim_ids: ["c1"] },
      { id: "2", severity: "high", description: "High risk", affected_claim_ids: ["c2"] },
      { id: "3", severity: "medium", description: "Medium risk", affected_claim_ids: ["c3"] },
    ];

    const processed = postProcessRisks(rawRisks, validClaimIds);
    assert.strictEqual(processed[0].severity, "high");
    assert.strictEqual(processed[1].severity, "medium");
    assert.strictEqual(processed[2].severity, "low");
    console.log("✔ Test 2 Passed: Risks sorted by severity (high first)");
  }

  // Test 3: Capped at 5 risks and renumbered
  {
    const rawRisks: Risk[] = Array.from({ length: 9 }, (_, i) => ({
      id: `raw-${i + 1}`,
      severity: "medium" as const,
      description: `Risk item ${i + 1}`,
      affected_claim_ids: ["c1"],
    }));

    const processed = postProcessRisks(rawRisks, validClaimIds);
    assert.strictEqual(processed.length, 5, "Capped at 5 risks");
    assert.strictEqual(processed[0].id, "r1");
    assert.strictEqual(processed[4].id, "r5");
    console.log("✔ Test 3 Passed: Capped at 5 and re-numbered r1..r5");
  }

  // Test 4: Skip condition
  {
    const allCurrentSafeReports = [
      {
        claim: claimCorrect,
        conflict: {
          claim_id: claimCorrect.id,
          stances: [],
          conflict_found: false,
          newest_supporting_date: "2023-09-22",
          verdict: "current" as const,
        },
        expiry: {
          claim_id: claimCorrect.id,
          volatility_class: "static" as const,
          reason: "historical",
          recheck_after_days: null,
          expires_on: null,
        },
      },
    ];

    assert.strictEqual(
      shouldSkipRiskDetection(allCurrentSafeReports),
      true,
      "Should skip LLM call when all claims are current and safe"
    );

    const volatileReport = [
      {
        claim: claimOutdatedCeo,
        conflict: {
          claim_id: claimOutdatedCeo.id,
          stances: [],
          conflict_found: true,
          newest_supporting_date: null,
          verdict: "outdated" as const,
        },
        expiry: {
          claim_id: claimOutdatedCeo.id,
          volatility_class: "fast" as const,
          reason: "executive change",
          recheck_after_days: 7,
          expires_on: "2026-11-26",
        },
      },
    ];

    assert.strictEqual(
      shouldSkipRiskDetection(volatileReport),
      false,
      "Should not skip risk detection when claim is outdated or fast volatility"
    );

    console.log("✔ Test 4 Passed: Skip path correctly identified for current/static claims");
  }

  console.log("\nAll detectRisks unit tests passed!\n");
}

async function runLiveEvaluation(): Promise<void> {
  const isReal = process.argv.includes("--real");
  if (!isReal) {
    console.log("MOCK MODE: Skipping live LLM call. Use '--real' to invoke Anthropic API.");
    return;
  }

  console.log("LIVE MODE: Invoking detectRisks() with outdated CEO report...");
  const sampleReports = [
    {
      claim: claimOutdatedCeo,
      conflict: {
        claim_id: claimOutdatedCeo.id,
        stances: [],
        conflict_found: true,
        newest_supporting_date: null,
        verdict: "outdated" as const,
      },
      expiry: {
        claim_id: claimOutdatedCeo.id,
        volatility_class: "fast" as const,
        reason: "leadership changes",
        recheck_after_days: 7,
        expires_on: "2026-11-26",
      },
    },
  ];

  const risks = await detectRisks("Twitter is led by CEO Parag Agrawal.", sampleReports);
  console.log("Live Detected Risks:", JSON.stringify(risks, null, 2));
}

async function main(): Promise<void> {
  runUnitTests();
  await runLiveEvaluation();
}

main().catch((err) => {
  console.error("detectRisks test runner failed:", err);
  process.exit(1);
});

