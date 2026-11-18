import "../preload";
import {
  searchEvidence,
  searchEvidenceForClaim,
  formatToIsoDate,
  TavilyConfigError,
  TavilyApiError,
  TavilyTimeoutError,
} from "./evidenceService";
import { Evidence, Claim, ApiError } from "../../../shared/schemas";
import { z } from "zod";

// Helper test assertion runner
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

async function runTests() {
  console.log("=================================================");
  console.log(" Running Evidence Retrieval Service Unit Tests");
  console.log("=================================================\n");

  // --- Test 1: Successful Tavily search with a valid API key ---
  console.log("Test 1: Successful Tavily search with valid API key");
  const mockSuccessFetch = async () => {
    return new Response(
      JSON.stringify({
        query: "Samsung Galaxy S24 price",
        results: [
          {
            title: "Samsung Galaxy S24 Official Specs and Price",
            url: "https://www.samsung.com/us/smartphones/galaxy-s24/",
            content: "The Samsung Galaxy S24 starts at $799 for the 128GB version.",
            published_date: "2026-01-17T18:00:00Z",
            score: 0.98,
          },
          {
            title: "Galaxy S24 Deals and Discounts",
            url: "https://example.com/tech/s24-deals",
            content: "Discounts of up to $100 are currently available on Galaxy S24.",
            published_date: "2026-02-01",
            score: 0.85,
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const results = await searchEvidence("c1", "Samsung Galaxy S24 price", {
      apiKey: "test-valid-key",
      fetchFn: mockSuccessFetch as unknown as typeof fetch,
    });

    assert(results.length === 2, "Returns 2 mapped evidence items");
    assert(results[0].claim_id === "c1", "Evidence claim_id matches input claim_id");
    assert(results[0].url === "https://www.samsung.com/us/smartphones/galaxy-s24/", "Evidence URL correctly mapped");
    assert(results[0].published_date === "2026-01-17", "Evidence published_date mapped to YYYY-MM-DD");
    assert(results[1].published_date === "2026-02-01", "Second evidence published_date correctly preserved");
  } catch (err: unknown) {
    assert(false, `Unexpected error in Test 1: ${(err as Error).message}`);
  }

  // --- Test 2: Missing TAVILY_API_KEY ---
  console.log("\nTest 2: Missing TAVILY_API_KEY handling");
  const previousKey = process.env.TAVILY_API_KEY;
  delete process.env.TAVILY_API_KEY;

  try {
    await searchEvidence("c1", "some claim query", {
      apiKey: "", // empty key
    });
    assert(false, "Should have thrown TavilyConfigError when API key is missing");
  } catch (err: unknown) {
    assert(err instanceof TavilyConfigError, "Throws TavilyConfigError when API key is missing");
  } finally {
    if (previousKey !== undefined) {
      process.env.TAVILY_API_KEY = previousKey;
    }
  }

  // --- Test 3: Empty search results ---
  console.log("\nTest 3: Empty search results handling");
  const mockEmptyFetch = async () => {
    return new Response(
      JSON.stringify({ query: "obscure fact", results: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const emptyResults = await searchEvidence("c2", "obscure fact", {
      apiKey: "test-valid-key",
      fetchFn: mockEmptyFetch as unknown as typeof fetch,
    });
    assert(Array.isArray(emptyResults), "Returns an array on empty results");
    assert(emptyResults.length === 0, "Array is empty when Tavily returns no results");
  } catch (err: unknown) {
    assert(false, `Unexpected error in Test 3: ${(err as Error).message}`);
  }

  // --- Test 4: Tavily API failure (HTTP 401 & 500) and Timeout ---
  console.log("\nTest 4: Tavily API failure and timeout handling");
  const mockFailureFetch = async () => {
    return new Response(
      JSON.stringify({ message: "Invalid API key provided" }),
      { status: 401, statusText: "Unauthorized", headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    await searchEvidence("c3", "test query", {
      apiKey: "invalid-key",
      fetchFn: mockFailureFetch as unknown as typeof fetch,
    });
    assert(false, "Should have thrown TavilyApiError on HTTP 401");
  } catch (err: unknown) {
    assert(err instanceof TavilyApiError, "Throws TavilyApiError on non-2xx HTTP status");
    if (err instanceof TavilyApiError) {
      assert(err.statusCode === 401, "TavilyApiError contains correct HTTP status code");
    }
  }

  // Timeout simulation
  const mockTimeoutFetch = async () => {
    const abortErr = new Error("The operation was aborted");
    abortErr.name = "AbortError";
    throw abortErr;
  };

  try {
    await searchEvidence("c4", "timeout query", {
      apiKey: "test-valid-key",
      fetchFn: mockTimeoutFetch as unknown as typeof fetch,
    });
    assert(false, "Should have thrown TavilyTimeoutError on AbortError");
  } catch (err: unknown) {
    assert(err instanceof TavilyTimeoutError, "Throws TavilyTimeoutError on timeout");
  }

  // --- Test 5: Evidence mapping to exact shared schema ---
  console.log("\nTest 5: Evidence schema validation (shared/schemas.ts)");
  const mockMixedFetch = async () => {
    return new Response(
      JSON.stringify({
        results: [
          {
            title: "Valid Source",
            url: "https://example.com/article",
            content: "Snippet content goes here.",
            published_date: "2026-04-12",
          },
          {
            title: "Malformed URL Source",
            url: "not-a-valid-url",
            content: "Should be skipped because URL fails z.string().url()",
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const validated = await searchEvidence("c5", "schema query", {
      apiKey: "test-key",
      fetchFn: mockMixedFetch as unknown as typeof fetch,
    });

    assert(validated.length === 1, "Only valid URL evidence items are retained");
    // Verify each result validates against Evidence schema
    const parseCheck = Evidence.safeParse(validated[0]);
    assert(parseCheck.success, "Evidence item strictly validates against shared Evidence schema");
    assert(z.array(Evidence).safeParse(validated).success, "Result strictly validates as z.array(Evidence)");
  } catch (err: unknown) {
    assert(false, `Unexpected error in Test 5: ${(err as Error).message}`);
  }

  // --- Test 6: Publication date handling ---
  console.log("\nTest 6: Publication date parsing rules");
  assert(formatToIsoDate("2026-03-10") === "2026-03-10", "Preserves exact YYYY-MM-DD");
  assert(formatToIsoDate("2026-03-10T14:30:00.000Z") === "2026-03-10", "Extracts date from ISO datetime string");
  assert(formatToIsoDate("Wed, 15 May 2024 08:00:00 GMT") === "2024-05-15", "Formats RFC date into YYYY-MM-DD");
  assert(formatToIsoDate("not-a-real-date") === null, "Returns null for invalid date string");
  assert(formatToIsoDate(null) === null, "Returns null for null input");
  assert(formatToIsoDate(undefined) === null, "Returns null for undefined input");
  assert(formatToIsoDate("") === null, "Returns null for empty string");
  assert(formatToIsoDate("   ") === null, "Returns null for whitespace-only string");

  // --- Test 7: Retrieval timestamp handling ---
  console.log("\nTest 7: Retrieval timestamp format");
  const testResults = await searchEvidence("c7", "test query", {
    apiKey: "test-key",
    fetchFn: mockSuccessFetch as unknown as typeof fetch,
  });
  const retrievedAt = testResults[0].retrieved_at;
  assert(typeof retrievedAt === "string" && retrievedAt.length > 0, "retrieved_at is non-empty string");
  const parsedDate = new Date(retrievedAt);
  assert(!isNaN(parsedDate.getTime()), "retrieved_at is valid ISO timestamp");

  // --- Test 8: Claim object search helper (searchEvidenceForClaim) ---
  console.log("\nTest 8: searchEvidenceForClaim helper");
  const testClaim: Claim = {
    id: "c8",
    text: "costs $799 at launch",
    type: "product",
    entity: "Galaxy S24",
    original_sentence: "The Galaxy S24 costs $799 at launch.",
    checkable: true,
  };

  const claimResults = await searchEvidenceForClaim(testClaim, {
    apiKey: "test-key",
    fetchFn: mockSuccessFetch as unknown as typeof fetch,
  });
  assert(claimResults.length === 2, "searchEvidenceForClaim successfully returns evidence");
  assert(claimResults[0].claim_id === "c8", "Claim id is correctly bound to evidence");

  console.log("\n=================================================");
  console.log(` Summary: ${passedTests} passed, ${failedTests} failed.`);
  console.log("=================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner threw uncaught exception:", err);
  process.exit(1);
});
