import "dotenv/config";
import assert from "node:assert";
import {
  computeConflictVerdict,
  detectConflicts,
  detectConflictsForAll,
} from "./detectConflicts";
import { Evidence, SourceStance } from "../../../shared/schemas";
import {
  claimCorrect,
  claimOutdatedCeo,
  claimPriceChange,
  fixtureClaims,
  mockEvidenceByClaimId,
} from "./__fixtures__/evidence";

function runUnitTests(): void {
  console.log("=================================================");
  console.log("Running Unit Tests: detectConflicts verdict paths");
  console.log("=================================================");

  const evSupportsOld: Evidence = {
    claim_id: "c1",
    url: "https://example.com/supports-2022",
    title: "Article 2022",
    snippet: "This is a valid snippet that says it is fully supported by all accounts.",
    published_date: "2022-01-01",
    retrieved_at: "2026-11-19T00:00:00Z",
  };

  const evSupportsNew: Evidence = {
    claim_id: "c1",
    url: "https://example.com/supports-2024",
    title: "Article 2024",
    snippet: "Current confirmed update officially confirms the statement remains true today.",
    published_date: "2024-06-01",
    retrieved_at: "2026-11-19T00:00:00Z",
  };

  const evOpposingOld: Evidence = {
    claim_id: "c1",
    url: "https://example.com/opposing-2021",
    title: "Article Opposing 2021",
    snippet: "Old contradiction stating the claim was not accurate back in 2021.",
    published_date: "2021-05-01",
    retrieved_at: "2026-11-19T00:00:00Z",
  };

  const evOpposingNew: Evidence = {
    claim_id: "c1",
    url: "https://example.com/opposing-2025",
    title: "Article Opposing 2025",
    snippet: "New development confirms the price changed and the older statement is now obsolete.",
    published_date: "2025-01-01",
    retrieved_at: "2026-11-19T00:00:00Z",
  };

  const evUndated: Evidence = {
    claim_id: "c1",
    url: "https://example.com/undated",
    title: "Undated Blog",
    snippet: "General thoughts contradicting the claim without any date.",
    published_date: null,
    retrieved_at: "2026-11-19T00:00:00Z",
  };

  // Path 1: Only supports -> "current"
  {
    const stances: SourceStance[] = [
      {
        url: evSupportsOld.url,
        stance: "supports",
        quote: "fully supported",
        reason: "corroborates",
        source_date: null, // should be overwritten by evidence published_date
      },
    ];
    const res = computeConflictVerdict(stances, [evSupportsOld], "c1");
    assert.strictEqual(res.verdict, "current");
    assert.strictEqual(res.conflict_found, false);
    assert.strictEqual(res.newest_supporting_date, "2022-01-01");
    console.log("✔ Verdict Path 1 Passed: Only supports gives 'current'");
  }

  // Path 2: Only contradicts/outdated -> "outdated"
  {
    const stances: SourceStance[] = [
      {
        url: evOpposingNew.url,
        stance: "contradicts",
        quote: "price changed",
        reason: "new price",
        source_date: null,
      },
    ];
    const res = computeConflictVerdict(stances, [evOpposingNew], "c1");
    assert.strictEqual(res.verdict, "outdated");
    assert.strictEqual(res.conflict_found, false);
    assert.strictEqual(res.newest_supporting_date, null);
    console.log("✔ Verdict Path 2 Passed: Only contradicts gives 'outdated'");
  }

  // Path 3: Both present, supporting is newer -> "current" with conflict_found = true
  {
    const stances: SourceStance[] = [
      {
        url: evOpposingOld.url,
        stance: "contradicts",
        quote: "not accurate",
        reason: "older issue",
        source_date: null,
      },
      {
        url: evSupportsNew.url,
        stance: "supports",
        quote: "officially confirms",
        reason: "newer proof",
        source_date: null,
      },
    ];
    const res = computeConflictVerdict(stances, [evOpposingOld, evSupportsNew], "c1");
    assert.strictEqual(res.verdict, "current");
    assert.strictEqual(res.conflict_found, true);
    assert.strictEqual(res.newest_supporting_date, "2024-06-01");
    console.log("✔ Verdict Path 3 Passed: Both present, supporting newer gives 'current'");
  }

  // Path 4: Both present, opposing is newer -> "outdated" with conflict_found = true
  {
    const stances: SourceStance[] = [
      {
        url: evSupportsOld.url,
        stance: "supports",
        quote: "fully supported",
        reason: "past fact",
        source_date: null,
      },
      {
        url: evOpposingNew.url,
        stance: "outdated",
        quote: "price changed",
        reason: "latest update",
        source_date: null,
      },
    ];
    const res = computeConflictVerdict(stances, [evSupportsOld, evOpposingNew], "c1");
    assert.strictEqual(res.verdict, "outdated");
    assert.strictEqual(res.conflict_found, true);
    assert.strictEqual(res.newest_supporting_date, "2022-01-01");
    console.log("✔ Verdict Path 4 Passed: Both present, opposing newer gives 'outdated'");
  }

  // Path 5: Both present with equal dates -> "disputed"
  {
    const evSupportsSameDate: Evidence = {
      ...evSupportsOld,
      published_date: "2023-01-01",
    };
    const evOpposingSameDate: Evidence = {
      ...evOpposingOld,
      published_date: "2023-01-01",
    };
    const stances: SourceStance[] = [
      {
        url: evSupportsSameDate.url,
        stance: "supports",
        quote: "fully supported",
        reason: "claim confirmed",
        source_date: null,
      },
      {
        url: evOpposingSameDate.url,
        stance: "contradicts",
        quote: "not accurate",
        reason: "claim denied",
        source_date: null,
      },
    ];
    const res = computeConflictVerdict(stances, [evSupportsSameDate, evOpposingSameDate], "c1");
    assert.strictEqual(res.verdict, "disputed");
    assert.strictEqual(res.conflict_found, true);
    console.log("✔ Verdict Path 5 Passed: Equal dates gives 'disputed'");
  }

  // Path 6: Both present, missing date on one side -> "disputed"
  {
    const stances: SourceStance[] = [
      {
        url: evSupportsNew.url,
        stance: "supports",
        quote: "officially confirms",
        reason: "proof",
        source_date: null,
      },
      {
        url: evUndated.url,
        stance: "contradicts",
        quote: "General thoughts",
        reason: "dispute",
        source_date: null,
      },
    ];
    const res = computeConflictVerdict(stances, [evSupportsNew, evUndated], "c1");
    assert.strictEqual(res.verdict, "disputed");
    assert.strictEqual(res.conflict_found, true);
    console.log("✔ Verdict Path 6 Passed: Missing date on either side gives 'disputed'");
  }

  // Path 7: No relevant evidence (or only unrelated) -> "unverifiable"
  {
    const stances: SourceStance[] = [
      {
        url: evSupportsOld.url,
        stance: "unrelated",
        quote: "This is a valid",
        reason: "doesn't talk about claim",
        source_date: null,
      },
    ];
    const res = computeConflictVerdict(stances, [evSupportsOld], "c1");
    assert.strictEqual(res.verdict, "unverifiable");
    assert.strictEqual(res.conflict_found, false);
    assert.strictEqual(res.newest_supporting_date, null);
    console.log("✔ Verdict Path 7 Passed: Unrelated only gives 'unverifiable'");
  }

  // Test 8: Quote length & grounding rule + Unknown URL drop
  {
    const stances: SourceStance[] = [
      {
        // Unknown URL that should be dropped
        url: "https://unknown-domain.com/ghost",
        stance: "supports",
        quote: "ghost quote",
        reason: "ghost",
        source_date: null,
      },
      {
        url: evSupportsOld.url,
        stance: "supports",
        // Quote that is > 15 words and NOT in snippet
        quote: "this is an extremely long hallucinated quote with more than fifteen words that does not appear anywhere inside the real evidence snippet text at all",
        reason: "test sanitize",
        source_date: null,
      },
    ];
    const res = computeConflictVerdict(stances, [evSupportsOld], "c1");
    assert.strictEqual(res.stances.length, 1, "Unknown URL should be dropped");
    assert.ok(res.stances[0].quote.split(/\s+/).length <= 15, "Quote should be under 15 words");
    assert.strictEqual(
      res.stances[0].quote,
      evSupportsOld.snippet.split(/\s+/).slice(0, 14).join(" "),
      "Fallback quote should be first 14 words of snippet"
    );
    console.log("✔ Test 8 Passed: Unknown URL dropped and quote length/grounding enforced");
  }

  console.log("\nAll detectConflicts unit tests passed!\n");
}

async function runMockParallelTest(): Promise<void> {
  console.log("Running detectConflictsForAll parallel execution with mock detector...");

  // Mock detector that handles claims and simulates one failure
  const mockDetector = async (claim: { id: string }, evidence: Evidence[]) => {
    if (claim.id === "c-fail") {
      throw new Error("Simulated LLM failure");
    }
    return computeConflictVerdict(
      evidence.map((e) => ({
        url: e.url,
        stance: "supports" as const,
        quote: e.snippet.split(/\s+/).slice(0, 5).join(" "),
        reason: "mock support",
        source_date: e.published_date,
      })),
      evidence,
      claim.id
    );
  };

  const claims = [
    claimOutdatedCeo,
    { id: "c-fail", text: "Failing claim", type: "other" as const, entity: "Fail", original_sentence: "Fail", checkable: false },
    claimPriceChange,
    claimCorrect,
  ];

  const results = await detectConflictsForAll(
    claims,
    mockEvidenceByClaimId,
    4,
    mockDetector
  );

  assert.strictEqual(results.length, 4);
  assert.strictEqual(results[1].claim_id, "c-fail");
  assert.strictEqual(results[1].verdict, "unverifiable");
  console.log("✔ Parallel execution and failure resilience verified successfully for 4 claims.");
}

async function runLiveEvaluation(): Promise<void> {
  const isReal = process.argv.includes("--real");
  if (!isReal) {
    console.log("MOCK MODE: Skipping live LLM call. Use '--real' to invoke Anthropic API.");
    return;
  }

  console.log("LIVE MODE: Invoking detectConflicts() on fixture claims...");
  const results = await detectConflictsForAll(fixtureClaims, mockEvidenceByClaimId, 4);
  console.log("Live Conflict Results:", JSON.stringify(results, null, 2));
}

async function main(): Promise<void> {
  runUnitTests();
  await runMockParallelTest();
  await runLiveEvaluation();
}

main().catch((err) => {
  console.error("detectConflicts test runner failed:", err);
  process.exit(1);
});
