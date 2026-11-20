import "dotenv/config";
import assert from "node:assert";
import { buildTimeline, postProcessTimelineEvents } from "./buildTimeline";
import { Evidence } from "../../../shared/schemas";
import { claimOutdatedCeo, evidenceOutdatedCeo } from "./__fixtures__/evidence";

function runUnitTests(): void {
  console.log("=================================================");
  console.log("Running Unit Tests: buildTimeline rules");
  console.log("=================================================");

  const fixedNow = new Date("2026-11-19T00:00:00Z");

  const evidenceList: Evidence[] = [
    {
      claim_id: "c1",
      url: "https://example.com/ev1",
      title: "Title 1",
      snippet: "Snippet 1",
      published_date: "2020-01-01",
      retrieved_at: "2026-11-19T00:00:00Z",
    },
    {
      claim_id: "c1",
      url: "https://example.com/ev2",
      title: "Title 2",
      snippet: "Snippet 2",
      published_date: "2022-05-15",
      retrieved_at: "2026-11-19T00:00:00Z",
    },
  ];

  // Test 1: Sorting, dedupe, future-date drop, and unknown-URL drop
  {
    const rawEvents = [
      {
        date: "2023-01-01",
        event: "Middle event in 2023",
        source_url: "https://example.com/ev2",
      },
      {
        date: "2018-06-01",
        event: "Earliest event in 2018",
        source_url: "https://example.com/ev1",
      },
      {
        date: "2018-06-01", // duplicate date & text
        event: "Earliest event in 2018!",
        source_url: "https://example.com/ev1",
      },
      {
        date: "2029-12-31", // future date relative to fixedNow 2026-11-19
        event: "Future hallucination event",
        source_url: "https://example.com/ev1",
      },
      {
        date: "2021-01-01",
        event: "Ghost event with unknown URL",
        source_url: "https://unknown-domain.com/fake",
      },
      {
        date: null, // should fallback to published_date of ev2 (2022-05-15)
        event: "Event with fallback to published date",
        source_url: "https://example.com/ev2",
      },
    ];

    const processed = postProcessTimelineEvents(rawEvents, evidenceList, "c1", fixedNow);

    // Verify lengths and filtering
    assert.strictEqual(processed.length, 3, "Filtered down to 3 valid distinct historical events");

    // Verify chronological order (oldest first)
    assert.strictEqual(processed[0].date, "2018-06-01");
    assert.strictEqual(processed[0].event, "Earliest event in 2018");

    assert.strictEqual(processed[1].date, "2022-05-15", "Used fallback published_date");
    assert.strictEqual(processed[1].event, "Event with fallback to published date");

    assert.strictEqual(processed[2].date, "2023-01-01");
    assert.strictEqual(processed[2].event, "Middle event in 2023");

    console.log("✔ Test 1 Passed: Sorting, dedupe, future-date drop, and fallback date verified");
  }

  // Test 2: Capped at 8 events
  {
    const rawEvents = Array.from({ length: 12 }, (_, i) => ({
      date: `2020-0${(i % 9) + 1}-01`,
      event: `Event milestone number ${i + 1}`,
      source_url: "https://example.com/ev1",
    }));

    const processed = postProcessTimelineEvents(rawEvents, evidenceList, "c1", fixedNow);
    assert.strictEqual(processed.length, 8, "Capped at exactly 8 events");
    console.log("✔ Test 2 Passed: Capped at 8 events successfully");
  }

  console.log("\nAll buildTimeline unit tests passed!\n");
}

async function runLiveEvaluation(): Promise<void> {
  const isReal = process.argv.includes("--real");
  if (!isReal) {
    console.log("MOCK MODE: Skipping live LLM call. Use '--real' to invoke Anthropic API.");
    return;
  }

  console.log("LIVE MODE: Invoking buildTimeline() on outdated CEO claim...");
  const timeline = await buildTimeline(claimOutdatedCeo, evidenceOutdatedCeo);
  console.log("Live Timeline Events:", JSON.stringify(timeline, null, 2));
}

async function main(): Promise<void> {
  runUnitTests();
  await runLiveEvaluation();
}

main().catch((err) => {
  console.error("buildTimeline test runner failed:", err);
  process.exit(1);
});

