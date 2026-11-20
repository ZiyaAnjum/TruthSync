import "dotenv/config";
import assert from "node:assert";
import {
  applyExpiryCalculations,
  computeExpiresOn,
  predictExpiry,
  RECHECK_DAYS,
} from "./predictExpiry";
import { Claim, VolatilityClass } from "../../../shared/schemas";
import { z } from "zod";
type VolatilityClassType = z.infer<typeof VolatilityClass>;
import { fixtureClaims } from "./__fixtures__/evidence";

function runUnitTests(): void {
  console.log("=================================================");
  console.log("Running Unit Tests: predictExpiry date math & rules");
  console.log("=================================================");

  const fixedNow = new Date("2026-11-19T00:00:00Z");

  // Test 1: Date math and table-driven checks
  {
    assert.strictEqual(computeExpiresOn(fixedNow, null), null, "null days should yield null expires_on");
    assert.strictEqual(computeExpiresOn(fixedNow, 1), "2026-11-20", "1 day addition");
    assert.strictEqual(computeExpiresOn(fixedNow, 7), "2026-11-26", "7 days addition");
    assert.strictEqual(computeExpiresOn(fixedNow, 30), "2026-12-19", "30 days addition");
    assert.strictEqual(computeExpiresOn(fixedNow, 180), "2027-05-18", "180 days addition");

    assert.strictEqual(RECHECK_DAYS.static, null);
    assert.strictEqual(RECHECK_DAYS.slow, 180);
    assert.strictEqual(RECHECK_DAYS.medium, 30);
    assert.strictEqual(RECHECK_DAYS.fast, 7);
    assert.strictEqual(RECHECK_DAYS.realtime, 1);
    console.log("✔ Test 1 Passed: Table-driven date math is accurate");
  }

  // Test 2: Unknown-id dropping and missing-id default
  {
    const claims: Claim[] = [
      {
        id: "c1",
        text: "The iPhone 15 was released on September 22, 2023",
        type: "date",
        entity: "Apple iPhone 15",
        original_sentence: "The Apple iPhone 15 was officially released on September 22, 2023.",
        checkable: true,
      },
      {
        id: "c2",
        text: "iPhone 15 starting price is $799",
        type: "number",
        entity: "Apple iPhone 15 price",
        original_sentence: "The base model starts at $799.",
        checkable: true,
      },
      {
        id: "c3",
        text: "Tim Cook is the CEO of Apple",
        type: "person_role",
        entity: "Apple CEO",
        original_sentence: "Tim Cook leads Apple as CEO.",
        checkable: true,
      },
    ];

    const rawPredictions = [
      {
        claim_id: "c1",
        volatility_class: "static" as VolatilityClassType,
        reason: "Release date is historical",
      },
      // c2 is intentionally missing to verify defaulting
      {
        claim_id: "c-ghost-999", // unknown claim id to verify dropping
        volatility_class: "fast" as VolatilityClassType,
        reason: "Unknown claim",
      },
      {
        claim_id: "c3",
        volatility_class: "fast" as VolatilityClassType,
        reason: "Executive positions change",
      },
    ];

    const results = applyExpiryCalculations(rawPredictions, claims, fixedNow);

    assert.strictEqual(results.length, 3, "Output should match claims length");

    // c1 (static)
    assert.strictEqual(results[0].claim_id, "c1");
    assert.strictEqual(results[0].volatility_class, "static");
    assert.strictEqual(results[0].recheck_after_days, null);
    assert.strictEqual(results[0].expires_on, null);

    // c2 (defaulted to medium)
    assert.strictEqual(results[1].claim_id, "c2");
    assert.strictEqual(results[1].volatility_class, "medium");
    assert.strictEqual(results[1].reason, "Defaulted: classification missing");
    assert.strictEqual(results[1].recheck_after_days, 30);
    assert.strictEqual(results[1].expires_on, "2026-12-19");

    // c3 (fast)
    assert.strictEqual(results[2].claim_id, "c3");
    assert.strictEqual(results[2].volatility_class, "fast");
    assert.strictEqual(results[2].recheck_after_days, 7);
    assert.strictEqual(results[2].expires_on, "2026-11-26");

    // ghost id dropped
    assert.ok(
      !results.some((r) => r.claim_id === "c-ghost-999"),
      "Ghost prediction should be dropped"
    );

    console.log("✔ Test 2 Passed: Missing claim defaulted and unknown claim dropped");
  }

  console.log("\nAll predictExpiry unit tests passed!\n");
}

async function runLiveEvaluation(): Promise<void> {
  const isReal = process.argv.includes("--real");
  if (!isReal) {
    console.log("MOCK MODE: Skipping live LLM call. Use '--real' to invoke Anthropic API.");
    return;
  }

  console.log("LIVE MODE: Invoking predictExpiry() with fixture claims...");
  const predictions = await predictExpiry(fixtureClaims);
  console.log("Live Predictions Result:", JSON.stringify(predictions, null, 2));
}

async function main(): Promise<void> {
  runUnitTests();
  await runLiveEvaluation();
}

main().catch((err) => {
  console.error("predictExpiry test runner failed:", err);
  process.exit(1);
});
