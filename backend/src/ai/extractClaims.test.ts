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
// PART 2: Five Sample AI Answers for Live API or Mock Extractions
// ============================================================================
export interface SampleCase {
  title: string;
  category: "fully_correct" | "outdated" | "opinions_only" | "numbers_and_dates" | "very_short";
  answerText: string;
  mockRawClaims: Claim[];
}

export const sampleCases: SampleCase[] = [
  {
    title: "Sample 1: Fully Correct Product Answer",
    category: "fully_correct",
    answerText:
      "The Apple iPhone 15 was officially announced on September 12, 2023. " +
      "It features the Apple A16 Bionic processor and has a 48-megapixel main camera sensor. " +
      "The base model launched with 128GB of internal storage.",
    mockRawClaims: [
      {
        id: "c1",
        text: "The Apple iPhone 15 was officially announced on September 12, 2023",
        type: "date",
        entity: "Apple iPhone 15 announcement",
        original_sentence: "The Apple iPhone 15 was officially announced on September 12, 2023.",
        checkable: true,
      },
      {
        id: "c2",
        text: "The Apple iPhone 15 features the Apple A16 Bionic processor",
        type: "product",
        entity: "Apple iPhone 15 processor",
        original_sentence: "It features the Apple A16 Bionic processor and has a 48-megapixel main camera sensor.",
        checkable: true,
      },
      {
        id: "c3",
        text: "The Apple iPhone 15 has a 48-megapixel main camera sensor",
        type: "number",
        entity: "Apple iPhone 15 camera sensor",
        original_sentence: "It features the Apple A16 Bionic processor and has a 48-megapixel main camera sensor.",
        checkable: true,
      },
      {
        id: "c4",
        text: "The base model Apple iPhone 15 launched with 128GB of internal storage",
        type: "product",
        entity: "Apple iPhone 15 storage",
        original_sentence: "The base model launched with 128GB of internal storage.",
        checkable: true,
      },
    ],
  },
  {
    title: "Sample 2: Outdated Information (Outdated CEO and Outdated Price)",
    category: "outdated",
    answerText:
      "Twitter is led by CEO Parag Agrawal. " +
      "The Tesla Model 3 base edition starts at an original price of $35,000 in the United States.",
    mockRawClaims: [
      {
        id: "c1",
        text: "Twitter is led by CEO Parag Agrawal",
        type: "person_role",
        entity: "Twitter CEO",
        original_sentence: "Twitter is led by CEO Parag Agrawal.",
        checkable: true,
      },
      {
        id: "c2",
        text: "The Tesla Model 3 base edition starts at an original price of $35,000 in the United States",
        type: "number",
        entity: "Tesla Model 3 price",
        original_sentence: "The Tesla Model 3 base edition starts at an original price of $35,000 in the United States.",
        checkable: true,
      },
    ],
  },
  {
    title: "Sample 3: Pure Opinions and Advice (No Checkable Facts)",
    category: "opinions_only",
    answerText:
      "In my humble opinion, the Google Pixel 8 is the most delightful and charming phone on the market. " +
      "I love the rounded corners and feel that anyone considering an upgrade should definitely buy one immediately. " +
      "You will certainly enjoy taking photos with it!",
    mockRawClaims: [], // Models should extract 0 claims for pure opinions/advice
  },
  {
    title: "Sample 4: Heavy Numbers and Dates",
    category: "numbers_and_dates",
    answerText:
      "PlayStation 5 was officially released on November 12, 2020 with an initial retail price of $499.99. " +
      "On October 10, 2023, Sony announced the PS5 Slim, which reduced internal volume by 30 percent and weight by 18 percent. " +
      "By December 31, 2023, total PlayStation 5 shipments exceeded 50 million units worldwide.",
    mockRawClaims: [
      {
        id: "c1",
        text: "PlayStation 5 was officially released on November 12, 2020",
        type: "date",
        entity: "PlayStation 5 release date",
        original_sentence: "PlayStation 5 was officially released on November 12, 2020 with an initial retail price of $499.99.",
        checkable: true,
      },
      {
        id: "c2",
        text: "PlayStation 5 initial retail price was $499.99",
        type: "number",
        entity: "PlayStation 5 price",
        original_sentence: "PlayStation 5 was officially released on November 12, 2020 with an initial retail price of $499.99.",
        checkable: true,
      },
      {
        id: "c3",
        text: "Sony announced the PS5 Slim on October 10, 2023",
        type: "event",
        entity: "Sony PS5 Slim announcement",
        original_sentence: "On October 10, 2023, Sony announced the PS5 Slim, which reduced internal volume by 30 percent and weight by 18 percent.",
        checkable: true,
      },
      {
        id: "c4",
        text: "The PS5 Slim reduced internal volume by 30 percent",
        type: "number",
        entity: "PS5 Slim volume reduction",
        original_sentence: "On October 10, 2023, Sony announced the PS5 Slim, which reduced internal volume by 30 percent and weight by 18 percent.",
        checkable: true,
      },
      {
        id: "c5",
        text: "The PS5 Slim reduced weight by 18 percent",
        type: "number",
        entity: "PS5 Slim weight reduction",
        original_sentence: "On October 10, 2023, Sony announced the PS5 Slim, which reduced internal volume by 30 percent and weight by 18 percent.",
        checkable: true,
      },
      {
        id: "c6",
        text: "Total PlayStation 5 shipments exceeded 50 million units worldwide by December 31, 2023",
        type: "number",
        entity: "PlayStation 5 shipments",
        original_sentence: "By December 31, 2023, total PlayStation 5 shipments exceeded 50 million units worldwide.",
        checkable: true,
      },
    ],
  },
  {
    title: "Sample 5: Very Short Single Claim",
    category: "very_short",
    answerText: "The Nintendo Switch launched worldwide on March 3, 2017.",
    mockRawClaims: [
      {
        id: "c1",
        text: "The Nintendo Switch launched worldwide on March 3, 2017",
        type: "date",
        entity: "Nintendo Switch launch date",
        original_sentence: "The Nintendo Switch launched worldwide on March 3, 2017.",
        checkable: true,
      },
    ],
  },
];

async function runSampleEvaluations(): Promise<void> {
  console.log("=================================================");
  console.log("Evaluation of 5 Sample AI Answers");
  console.log("=================================================");

  const runLive = process.argv.includes("--real");

  if (runLive) {
    console.log("Running in LIVE mode using extractClaims() with Anthropic API...\n");
    for (let i = 0; i < sampleCases.length; i++) {
      const sample = sampleCases[i];
      console.log(`\n--- [Sample ${i + 1}/5] ${sample.title} (${sample.category}) ---`);
      console.log(`Input Text: "${sample.answerText}"`);
      try {
        const claims = await extractClaims(sample.answerText);
        console.log(`Extracted Claims (${claims.length}):`);
        console.log(JSON.stringify(claims, null, 2));
      } catch (err) {
        console.error(`Live extraction failed for sample ${i + 1}:`, err);
      }
    }
  } else {
    console.log("Running in MOCK mode (post-processing applied to realistic mock LLM output).");
    console.log("Tip: Pass '--real' (e.g. 'npx tsx src/ai/extractClaims.test.ts --real') to call the live API.\n");

    for (let i = 0; i < sampleCases.length; i++) {
      const sample = sampleCases[i];
      console.log(`\n--- [Sample ${i + 1}/5] ${sample.title} (${sample.category}) ---`);
      console.log(`Input Text: "${sample.answerText}"`);

      const claims = postProcessClaims(sample.mockRawClaims, sample.answerText);
      console.log(`Extracted Claims (${claims.length}):`);
      console.log(JSON.stringify(claims, null, 2));
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
