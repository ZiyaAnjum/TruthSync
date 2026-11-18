import assert from "node:assert";
import { extractClaims, postProcessClaims } from "./extractClaims";
import { Claim } from "../../../shared/schemas";

// ============================================================================
// PART 1: Mock Post-Processing Unit Tests (No LLM / API Key Required)
// ============================================================================
function runPostProcessingUnitTests(): void {
  console.log("=================================================");
  console.log("Running Unit Tests: postProcessClaims() with Mocks");
  console.log("=================================================");

  const sampleAnswer =
    "The Sony WH-1000XM5 headphones were released in May 2022. They currently retail for $399. " +
    "They feature 30 hours of battery life. The headphones use 30mm audio drivers.";

  // Test 1: Drops empty text claims
  {
    const raw: Claim[] = [
      {
        id: "c1",
        text: "",
        type: "product",
        entity: "Sony WH-1000XM5",
        original_sentence: "They currently retail for $399.",
        checkable: true,
      },
      {
        id: "c2",
        text: "   ",
        type: "product",
        entity: "Sony WH-1000XM5",
        original_sentence: "They currently retail for $399.",
        checkable: true,
      },
      {
        id: "c3",
        text: "The Sony WH-1000XM5 retail price is $399",
        type: "number",
        entity: "Sony WH-1000XM5",
        original_sentence: "They currently retail for $399.",
        checkable: true,
      },
    ];

    const processed = postProcessClaims(raw, sampleAnswer);
    assert.strictEqual(processed.length, 1, "Should drop claims with empty text");
    assert.strictEqual(processed[0].id, "c1", "Should re-number remaining claim to c1");
    console.log("✔ Test 1 Passed: Empty text claims dropped successfully");
  }

  // Test 2: Drops duplicate claims (case-insensitive)
  {
    const raw: Claim[] = [
      {
        id: "c1",
        text: "The Sony WH-1000XM5 headphones retail for $399",
        type: "number",
        entity: "Sony WH-1000XM5",
        original_sentence: "They currently retail for $399.",
        checkable: true,
      },
      {
        id: "c2",
        text: "the sony wh-1000xm5 headphones retail for $399",
        type: "number",
        entity: "Sony WH-1000XM5",
        original_sentence: "They currently retail for $399.",
        checkable: true,
      },
    ];

    const processed = postProcessClaims(raw, sampleAnswer);
    assert.strictEqual(processed.length, 1, "Duplicate claim should be removed");
    console.log("✔ Test 2 Passed: Duplicate claims dropped successfully");
  }

  // Test 3: Checks and reconciles original_sentence
  {
    const raw: Claim[] = [
      {
        id: "c1",
        text: "Sony WH-1000XM5 release date is May 2022",
        type: "date",
        entity: "Sony WH-1000XM5",
        // Case mismatch that exists in text:
        original_sentence: "the sony wh-1000xm5 headphones were released in may 2022.",
        checkable: true,
      },
      {
        id: "c2",
        text: "Made up hallucination not in the answer",
        type: "other",
        entity: "Hallucination",
        // Sentence that does not exist in answerText at all:
        original_sentence: "This sentence was never written in the input answer.",
        checkable: false,
      },
    ];

    const processed = postProcessClaims(raw, sampleAnswer);
    assert.strictEqual(processed.length, 1, "Non-existent sentence claim should be dropped");
    assert.strictEqual(
      processed[0].original_sentence,
      "The Sony WH-1000XM5 headphones were released in May 2022.",
      "Casing should be corrected to match input text verbatim"
    );
    console.log("✔ Test 3 Passed: Sentence presence checked and reconciled successfully");
  }

  // Test 4: Capped at 10 claims and renumbered sequentially
  {
    const sentence = "The device costs $100.";
    const answer = "The device costs $100.";
    const raw: Claim[] = Array.from({ length: 14 }, (_, i) => ({
      id: `raw_${i + 1}`,
      text: `Fact number ${i + 1}`,
      type: "number" as const,
      entity: `Device ${i + 1}`,
      original_sentence: sentence,
      checkable: true,
    }));

    const processed = postProcessClaims(raw, answer);
    assert.strictEqual(processed.length, 10, "Should cap at 10 claims");
    assert.strictEqual(processed[0].id, "c1");
    assert.strictEqual(processed[9].id, "c10");
    console.log("✔ Test 4 Passed: Renumbered c1..c10 and capped at 10 claims");
  }

  console.log("\nAll unit tests passed!\n");
}

// ============================================================================
// PART 2: Five Sample AI Answers for Real API or Mock Runs
// ============================================================================
export interface SampleCase {
  title: string;
  category: "fully_correct" | "outdated" | "opinions_only" | "numbers_and_dates" | "very_short";
  answerText: string;
}

export const sampleCases: SampleCase[] = [
  {
    title: "Sample 1: Fully Correct Product Answer",
    category: "fully_correct",
    answerText:
      "The Apple iPhone 15 was officially announced on September 12, 2023. " +
      "It features the Apple A16 Bionic processor and has a 48-megapixel main camera sensor. " +
      "The base model launched with 128GB of internal storage.",
  },
  {
    title: "Sample 2: Outdated Information (Outdated CEO and Outdated Price)",
    category: "outdated",
    answerText:
      "Twitter is led by CEO Parag Agrawal. " +
      "The Tesla Model 3 base edition starts at an original price of $35,000 in the United States.",
  },
  {
    title: "Sample 3: Pure Opinions and Advice (No Checkable Facts)",
    category: "opinions_only",
    answerText:
      "In my humble opinion, the Google Pixel 8 is the most delightful and charming phone on the market. " +
      "I love the rounded corners and feel that anyone considering an upgrade should definitely buy one immediately. " +
      "You will certainly enjoy taking photos with it!",
  },
  {
    title: "Sample 4: Heavy Numbers and Dates",
    category: "numbers_and_dates",
    answerText:
      "PlayStation 5 was officially released on November 12, 2020 with an initial retail price of $499.99. " +
      "On October 10, 2023, Sony announced the PS5 Slim, which reduced internal volume by 30 percent and weight by 18 percent. " +
      "By December 31, 2023, total PlayStation 5 shipments exceeded 50 million units worldwide.",
  },
  {
    title: "Sample 5: Very Short Single Claim",
    category: "very_short",
    answerText: "The Nintendo Switch launched worldwide on March 3, 2017.",
  },
];

async function runSampleEvaluations(): Promise<void> {
  console.log("=================================================");
  console.log("Running Evaluation on 5 Sample AI Answers");
  console.log("=================================================");

  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

  if (!hasApiKey) {
    console.log("ℹ ANTHROPIC_API_KEY is not set in backend/.env.");
    console.log("To run live extraction against Claude, set ANTHROPIC_API_KEY in backend/.env.");
    console.log("Displaying the 5 sample answers configured for live execution:\n");

    sampleCases.forEach((sample, i) => {
      console.log(`[Sample ${i + 1}] ${sample.title}`);
      console.log(`Category: ${sample.category}`);
      console.log(`Input Text: "${sample.answerText}"`);
      console.log("-------------------------------------------------");
    });
    return;
  }

  console.log("Found ANTHROPIC_API_KEY. Calling extractClaims() for each sample:\n");

  for (let i = 0; i < sampleCases.length; i++) {
    const sample = sampleCases[i];
    console.log(`\n--- [Sample ${i + 1}/5] ${sample.title} (${sample.category}) ---`);
    console.log(`Input: "${sample.answerText}"`);

    try {
      const claims = await extractClaims(sample.answerText);
      console.log(`Extracted Claims (${claims.length}):`);
      console.log(JSON.stringify(claims, null, 2));
    } catch (err) {
      console.error(`Extraction failed for sample ${i + 1}:`, err);
    }
  }
}

async function main(): Promise<void> {
  runPostProcessingUnitTests();
  await runSampleEvaluations();
}

main().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
