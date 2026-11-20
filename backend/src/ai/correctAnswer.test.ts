import "dotenv/config";
import assert from "node:assert";
import { z } from "zod";
import {
  applyChanges,
  ClaimReportLike,
  correctAnswer,
} from "./correctAnswer";
import { Change, Evidence } from "../../../shared/schemas";

type ChangeType = z.infer<typeof Change>;
import {
  claimOutdatedCeo,
  claimPriceChange,
  evidenceOutdatedCeo,
  evidencePriceChange,
} from "./__fixtures__/evidence";

function runUnitTests(): void {
  console.log("=================================================");
  console.log("Running Unit Tests: correctAnswer minimal changes");
  console.log("=================================================");

  const sampleAnswer =
    "Twitter is led by CEO Parag Agrawal. The Tesla Model 3 base edition starts at an original price of $35,000 in the United States.";

  const reports: ClaimReportLike[] = [
    {
      claim: claimOutdatedCeo,
      conflict: {
        claim_id: claimOutdatedCeo.id,
        stances: [],
        conflict_found: true,
        newest_supporting_date: null,
        verdict: "outdated",
      },
      evidence: evidenceOutdatedCeo,
    },
    {
      claim: claimPriceChange,
      conflict: {
        claim_id: claimPriceChange.id,
        stances: [],
        conflict_found: true,
        newest_supporting_date: null,
        verdict: "outdated",
      },
      evidence: evidencePriceChange,
    },
  ];

  // Test 1: Successful minimal correction with byte-for-byte fidelity outside spans
  {
    const validChanges: ChangeType[] = [
      {
        claim_id: "c-ceo",
        original_span: "Parag Agrawal",
        new_span: "Linda Yaccarino",
        source_url: "https://www.bbc.com/news/business-65814580", // valid URL in evidenceOutdatedCeo
      },
      {
        claim_id: "c-price",
        original_span: "$35,000",
        new_span: "$38,990",
        source_url:
          "https://www.reuters.com/business/autos-transportation/tesla-launches-restyled-model-3-north-america-2024-01-10/", // valid URL
      },
    ];

    const result = applyChanges(sampleAnswer, validChanges, reports);
    assert.ok(result !== null);
    assert.strictEqual(
      result?.corrected_text,
      "Twitter is led by CEO Linda Yaccarino. The Tesla Model 3 base edition starts at an original price of $38,990 in the United States."
    );
    assert.strictEqual(result?.changes.length, 2);

    // Verify byte-for-byte fidelity outside replaced spans
    const prefix = "Twitter is led by CEO ";
    const middle = ". The Tesla Model 3 base edition starts at an original price of ";
    const suffix = " in the United States.";
    assert.ok(result?.corrected_text.startsWith(prefix));
    assert.ok(result?.corrected_text.includes(middle));
    assert.ok(result?.corrected_text.endsWith(suffix));

    console.log("✔ Test 1 Passed: Minimal correction applied with byte-for-byte outside fidelity");
  }

  // Test 2: Span-not-found drop and wrong-URL drop
  {
    const badChanges: ChangeType[] = [
      {
        claim_id: "c-ceo",
        original_span: "This substring does not exist in answer text",
        new_span: "Something",
        source_url: "https://www.bbc.com/news/business-65814580",
      },
      {
        claim_id: "c-price",
        original_span: "$35,000",
        new_span: "$38,990",
        source_url: "https://unauthorized-fake-site.com/hack", // not in evidence
      },
    ];

    const result = applyChanges(sampleAnswer, badChanges, reports);
    assert.strictEqual(result, null, "Should return null if all changes are dropped");
    console.log("✔ Test 2 Passed: Span-not-found and unauthorized-URL changes dropped");
  }

  // Test 3: Multiple-occurrence span drop
  {
    const repeatedText = "The price was $100. Then the second price was $100.";
    const changes: ChangeType[] = [
      {
        claim_id: "c-price",
        original_span: "$100", // appears twice!
        new_span: "$120",
        source_url: evidencePriceChange[0].url,
      },
    ];
    const result = applyChanges(repeatedText, changes, reports);
    assert.strictEqual(result, null, "Ambiguous multiple-occurrence span must be dropped");
    console.log("✔ Test 3 Passed: Multiple-occurrence spans safely dropped");
  }

  // Test 4: Overlapping spans (first kept, second dropped)
  {
    const text = "The Model 3 costs $35,000 today.";
    const changes: ChangeType[] = [
      {
        claim_id: "c-price",
        original_span: "Model 3 costs $35,000",
        new_span: "Model 3 base starts at $38,990",
        source_url: evidencePriceChange[1].url,
      },
      {
        claim_id: "c-price",
        original_span: "$35,000", // overlaps with previous span!
        new_span: "$38,990",
        source_url: evidencePriceChange[1].url,
      },
    ];
    const result = applyChanges(text, changes, reports);
    assert.ok(result !== null);
    assert.strictEqual(result?.changes.length, 1, "Only first non-overlapping span kept");
    assert.strictEqual(result?.corrected_text, "The Model 3 base starts at $38,990 today.");
    console.log("✔ Test 4 Passed: Overlapping spans handled correctly (first kept)");
  }

  console.log("\nAll correctAnswer unit tests passed!\n");
}

async function runLiveEvaluation(): Promise<void> {
  const isReal = process.argv.includes("--real");
  if (!isReal) {
    console.log("MOCK MODE: Skipping live LLM call. Use '--real' to invoke Anthropic API.");
    return;
  }

  console.log("LIVE MODE: Invoking correctAnswer() with outdated CEO and price claims...");
  const answer =
    "Twitter is led by CEO Parag Agrawal. The Tesla Model 3 base edition starts at an original price of $35,000 in the United States.";
  const reports: ClaimReportLike[] = [
    {
      claim: claimOutdatedCeo,
      conflict: {
        claim_id: claimOutdatedCeo.id,
        stances: [],
        conflict_found: true,
        newest_supporting_date: null,
        verdict: "outdated",
      },
      evidence: evidenceOutdatedCeo,
    },
    {
      claim: claimPriceChange,
      conflict: {
        claim_id: claimPriceChange.id,
        stances: [],
        conflict_found: true,
        newest_supporting_date: null,
        verdict: "outdated",
      },
      evidence: evidencePriceChange,
    },
  ];

  const correction = await correctAnswer(answer, reports);
  console.log("Live Correction Result:", JSON.stringify(correction, null, 2));
}

async function main(): Promise<void> {
  runUnitTests();
  await runLiveEvaluation();
}

main().catch((err) => {
  console.error("correctAnswer test runner failed:", err);
  process.exit(1);
});
