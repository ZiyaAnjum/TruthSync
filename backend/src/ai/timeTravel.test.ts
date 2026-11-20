import "dotenv/config";
import assert from "node:assert";
import { timeTravelVerify } from "./timeTravel";
import { Evidence } from "../../../shared/schemas";
import {
  claimOutdatedCeo,
  evidenceOutdatedCeo,
} from "./__fixtures__/evidence";

async function runUnitTests(): Promise<void> {
  console.log("=================================================");
  console.log("Running Unit Tests: timeTravelVerify");
  console.log("=================================================");

  const fixedNow = new Date("2026-11-19T00:00:00Z");

  const mockDetector = async (_c: any, evList: Evidence[]) => {
    const hasTermination = evList.some(
      (e) => e.published_date && e.published_date >= "2022-10-27"
    );
    return {
      claim_id: "c-ceo",
      stances: [],
      conflict_found: hasTermination,
      newest_supporting_date: "2021-11-29",
      verdict: hasTermination ? ("outdated" as const) : ("current" as const),
    };
  };

  // Test 1: "Was true then, outdated now"
  {
    const asOfDate = "2021-12-01";
    const res = await timeTravelVerify(
      claimOutdatedCeo,
      evidenceOutdatedCeo,
      evidenceOutdatedCeo,
      asOfDate,
      fixedNow,
      mockDetector
    );
    assert.strictEqual(res.as_of_date, "2021-12-01");
    assert.strictEqual(res.verdict_then, "current");
    assert.strictEqual(res.was_true_then, true);
    assert.strictEqual(res.verdict_now, "outdated");
    assert.ok(res.explanation.includes("As of 2021-12-01, the claim was supported and considered current"));
    console.log("✔ Test 1 Passed: 'Was true then, outdated now' path verified");
  }

  // Test 2: No-evidence before asOfDate path (returns unverifiable)
  {
    const asOfDate = "2015-01-01"; // Before Twitter had any articles about Agrawal as CEO
    const res = await timeTravelVerify(
      claimOutdatedCeo,
      evidenceOutdatedCeo,
      evidenceOutdatedCeo,
      asOfDate,
      fixedNow,
      mockDetector
    );
    assert.strictEqual(res.verdict_then, "unverifiable");
    assert.strictEqual(res.was_true_then, null);
    assert.ok(res.explanation.includes("no verifiable evidence dated on or before 2015-01-01"));
    console.log("✔ Test 2 Passed: No-evidence before asOfDate returns unverifiable");
  }

  // Test 3: Date filter rule (excludes null dates and future dates)
  {
    const mixedEvidence: Evidence[] = [
      {
        claim_id: "c-ceo",
        url: "https://example.com/2020",
        title: "2020",
        snippet: "2020 snippet",
        published_date: "2020-05-01",
        retrieved_at: "2026-11-19T00:00:00Z",
      },
      {
        claim_id: "c-ceo",
        url: "https://example.com/2023",
        title: "2023",
        snippet: "2023 snippet",
        published_date: "2023-01-01",
        retrieved_at: "2026-11-19T00:00:00Z",
      },
      {
        claim_id: "c-ceo",
        url: "https://example.com/undated",
        title: "Undated",
        snippet: "Undated snippet",
        published_date: null, // should be excluded
        retrieved_at: "2026-11-19T00:00:00Z",
      },
    ];

    let passedEvidenceCount = 0;
    const testDetector = async (_c: any, evList: Evidence[]) => {
      passedEvidenceCount = evList.length;
      return {
        claim_id: "c-ceo",
        stances: [],
        conflict_found: false,
        newest_supporting_date: "2020-05-01",
        verdict: "current" as const,
      };
    };

    await timeTravelVerify(
      claimOutdatedCeo,
      mixedEvidence,
      [],
      "2020-12-31",
      fixedNow,
      testDetector
    );
    // Only the 2020-05-01 item should pass (2023 is after asOfDate, null date is excluded)
    assert.strictEqual(passedEvidenceCount, 1, "Only items <= asOfDate with non-null date pass");
    console.log("✔ Test 3 Passed: Date filtering strictly enforced");
  }

  // Test 4: Future asOfDate throws Error
  {
    await assert.rejects(
      async () => {
        await timeTravelVerify(
          claimOutdatedCeo,
          evidenceOutdatedCeo,
          evidenceOutdatedCeo,
          "2030-01-01",
          fixedNow,
          mockDetector
        );
      },
      /cannot be in the future/,
      "Future asOfDate must throw an error"
    );
    console.log("✔ Test 4 Passed: Future asOfDate safely rejected");
  }

  // Test 5: Invalid date format throws Error
  {
    await assert.rejects(
      async () => {
        await timeTravelVerify(
          claimOutdatedCeo,
          evidenceOutdatedCeo,
          evidenceOutdatedCeo,
          "not-a-date",
          fixedNow,
          mockDetector
        );
      },
      /Invalid asOfDate format/,
      "Malformed asOfDate must throw an error"
    );
    console.log("✔ Test 5 Passed: Invalid asOfDate format rejected");
  }

  // Test 6: Mixed pre- and post-date evidence excludes post-date evidence from verdict_then and evidence_used
  {
    const asOfDate = "2022-01-01";
    const res = await timeTravelVerify(
      claimOutdatedCeo,
      evidenceOutdatedCeo,
      evidenceOutdatedCeo,
      asOfDate,
      fixedNow,
      mockDetector
    );

    assert.strictEqual(res.verdict_then, "current", "verdict_then must be 'current'");
    assert.strictEqual(res.was_true_then, true, "was_true_then must be true");
    assert.deepStrictEqual(
      res.evidence_used,
      ["https://www.reuters.com/technology/twitter-ceo-dorsey-steps-down-2021-11-29/"],
      "evidence_used must strictly contain only pre-asOfDate URLs"
    );
    assert.ok(
      !res.evidence_used.some((u) => u.includes("cnbc") || u.includes("bbc")),
      "Post-date URLs must never appear in evidence_used"
    );
    console.log("✔ Test 6 Passed: Mixed evidence correctly filters out post-date URLs from evidence_used and verdict_then");
  }

  console.log("\nAll timeTravel unit tests passed!\n");
}

async function runLiveEvaluation(): Promise<void> {
  const isReal = process.argv.includes("--real");
  if (!isReal) {
    console.log("MOCK MODE: Skipping live LLM call. Use '--real' to invoke Anthropic API.");
    return;
  }

  console.log("LIVE MODE: Invoking timeTravelVerify() with live detector...");
  const res = await timeTravelVerify(
    claimOutdatedCeo,
    evidenceOutdatedCeo,
    evidenceOutdatedCeo,
    "2022-01-01"
  );
  console.log("Live Time-Travel Result:", JSON.stringify(res, null, 2));
}

async function main(): Promise<void> {
  await runUnitTests();
  await runLiveEvaluation();
}

main().catch((err) => {
  console.error("timeTravel test runner failed:", err);
  process.exit(1);
});
