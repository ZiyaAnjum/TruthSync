import "../preload";
import {
  runVerificationPipeline,
  PipelinePendingDependencyError,
  registerPipelineService,
  clearRegisteredServices,
} from "./pipelineService";
import {
  createVerification,
  getVerificationById,
  clearInMemoryStore,
} from "../db/verificationRepository";
import {
  Claim,
  Evidence,
  ExpiryPrediction,
  ConflictResult,
  Risk,
  Correction,
  Report,
} from "../../../shared/schemas";

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

async function runPipelineTests() {
  console.log("=================================================");
  console.log(" Running Pipeline Orchestration Unit Tests (B-02 & B-03)");
  console.log("=================================================\n");

  clearInMemoryStore();
  clearRegisteredServices();

  // Test 1: Missing C dependencies in production mode
  console.log("Test 1: Pipeline halts gracefully when Member C services are pending");
  const testId1 = "v-test-1";
  await createVerification({
    id: testId1,
    original_answer: "The Galaxy S24 costs $799.",
    status: "queued",
    created_at: new Date().toISOString(),
  });

  try {
    // Run pipeline with no registered C services
    await runVerificationPipeline(testId1, "The Galaxy S24 costs $799.");
    assert(false, "Should have thrown PipelinePendingDependencyError when C services are missing");
  } catch (err: unknown) {
    assert(
      err instanceof PipelinePendingDependencyError,
      "Throws PipelinePendingDependencyError when C components are not yet integrated"
    );
    if (err instanceof PipelinePendingDependencyError) {
      assert(
        err.missingServices.includes("Claim Extractor (C-01)"),
        "Identifies Claim Extractor (C-01) as pending dependency"
      );
    }
  }

  // Verify status in DB was updated to 'failed' with error note
  const record1 = await getVerificationById(testId1);
  assert(record1 !== null, "Verification record exists in database");
  assert(record1?.status === "failed", "Verification status updated to failed in DB");
  assert(
    record1?.error?.includes("Pending dependencies") === true,
    "Record stores clear error message about pending dependencies"
  );

  // Test 2: Input validation
  console.log("\nTest 2: Input validation for empty or invalid answer");
  try {
    await runVerificationPipeline("v-test-invalid", "");
    assert(false, "Should reject empty answer string");
  } catch {
    assert(true, "Rejects empty answer text per AnalyzeRequest schema");
  }

  // Test 3: Full pipeline execution with mocked C services
  console.log("\nTest 3: Full pipeline execution with mocked Member C services");
  const testId2 = "v-test-2";
  await createVerification({
    id: testId2,
    original_answer: "The Galaxy S24 costs $799. It runs One UI 6.1.",
    status: "queued",
    created_at: new Date().toISOString(),
  });

  // Mocked Member C services
  const mockClaimExtractor = async (_text: string): Promise<Claim[]> => [
    {
      id: "c1",
      text: "The Galaxy S24 costs $799",
      type: "product",
      entity: "Galaxy S24",
      original_sentence: "The Galaxy S24 costs $799.",
      checkable: true,
    },
    {
      id: "c2",
      text: "It runs One UI 6.1",
      type: "product",
      entity: "Galaxy S24",
      original_sentence: "It runs One UI 6.1.",
      checkable: true,
    },
  ];

  // Mocked Member B Tavily evidence retriever
  const mockEvidenceRetriever = async (claimId: string, _query: string): Promise<Evidence[]> => [
    {
      claim_id: claimId,
      url: "https://example.com/samsung-s24",
      title: "Samsung Official",
      snippet: "Galaxy S24 starting at $799, running One UI 6.1.",
      published_date: "2026-01-20",
      retrieved_at: new Date().toISOString(),
    },
  ];

  const mockExpiryPredictor = async (claims: Claim[]): Promise<ExpiryPrediction[]> =>
    claims.map((c) => ({
      claim_id: c.id,
      volatility_class: "medium",
      reason: "Product pricing and software versions update periodically.",
      recheck_after_days: 30,
      expires_on: "2026-12-19",
    }));

  const mockConflictDetector = async (claim: Claim, _evidence: Evidence[]): Promise<ConflictResult> => ({
    claim_id: claim.id,
    stances: [
      {
        url: "https://example.com/samsung-s24",
        stance: "supports",
        quote: "starting at $799",
        reason: "Matches official product specs",
        source_date: "2026-01-20",
      },
    ],
    conflict_found: false,
    newest_supporting_date: "2026-01-20",
    verdict: "current", // corresponds to Supported (1.0 point)
  });

  const mockRiskDetector = async (
    _answer: string,
    _reports: { claim: Claim; conflict: ConflictResult; expiry: ExpiryPrediction }[]
  ): Promise<Risk[]> => [
    {
      id: "r1",
      severity: "low",
      description: "Prices subject to seasonal promotions.",
      affected_claim_ids: ["c1"],
    },
  ];

  const mockCorrectionEngine = async (
    _original: string,
    _reports: { claim: Claim; conflict: ConflictResult; evidence: Evidence[] }[]
  ): Promise<Correction | null> => null;

  const report = await runVerificationPipeline(testId2, "The Galaxy S24 costs $799. It runs One UI 6.1.", {
    claimExtractor: mockClaimExtractor,
    evidenceRetriever: mockEvidenceRetriever,
    expiryPredictor: mockExpiryPredictor,
    conflictDetector: mockConflictDetector,
    riskDetector: mockRiskDetector,
    correctionEngine: mockCorrectionEngine,
  });

  // Verify Report properties
  assert(report.id === testId2, "Report ID matches verification ID");
  assert(report.claims.length === 2, "Report contains 2 processed claims");
  assert(report.overall_freshness_score === 100, `Overall freshness is 100 for 'current' claims, got ${report.overall_freshness_score}`);
  // Initial confidence 90, single source (-20) -> 70
  assert(report.claims[0].score.confidence === 70, `Claim confidence correctly scored with B-05 logic: got ${report.claims[0].score.confidence}`);
  assert(report.claims[0].evidence.length === 1, "Evidence retrieval results correctly bound to claim");
  assert(report.risks.length === 1, "Risks attached to report");

  // Validate the final Report against the official shared schema
  const schemaValidation = Report.safeParse(report);
  assert(schemaValidation.success, "Final Report strictly satisfies shared Report schema");

  // Verify that the completed report is persisted in the repository
  const record2 = await getVerificationById(testId2);
  assert(record2?.status === "done", "Verification marked as done in database");
  assert(record2?.report !== null && record2?.report !== undefined, "Report is stored in database record");
  assert(record2?.freshness_score === 100, "Freshness score stored on verification record");

  // Test 4: Empty claims handling ("No checkable claims found")
  console.log("\nTest 4: Empty claims extracted handling");
  const testId3 = "v-test-3";
  await createVerification({
    id: testId3,
    original_answer: "Hello world, hope you have a nice day!",
    status: "queued",
    created_at: new Date().toISOString(),
  });

  const emptyReport = await runVerificationPipeline(
    testId3,
    "Hello world, hope you have a nice day!",
    {
      claimExtractor: async () => [], // No checkable claims extracted
      evidenceRetriever: mockEvidenceRetriever,
    }
  );

  assert(emptyReport.claims.length === 0, "Empty claims result handled safely");
  assert(emptyReport.overall_freshness_score === 0, "Score is 0 when no claims are checkable");
  const record3 = await getVerificationById(testId3);
  assert(record3?.status === "done", "Empty verification completes safely without crashing");

  // Test 5: Single failing evidence fetch does not crash the pipeline
  console.log("\nTest 5: Resilient evidence fetching (single failure does not abort pipeline)");
  const testId4 = "v-test-4";
  await createVerification({
    id: testId4,
    original_answer: "Test claim for resilient evidence.",
    status: "queued",
    created_at: new Date().toISOString(),
  });

  const failingRetriever = async (_claimId: string, _query: string): Promise<Evidence[]> => {
    throw new Error("Network timeout or Tavily rate limit");
  };

  const resilientReport = await runVerificationPipeline(testId4, "Test claim for resilient evidence.", {
    claimExtractor: mockClaimExtractor,
    evidenceRetriever: failingRetriever,
    expiryPredictor: mockExpiryPredictor,
    conflictDetector: mockConflictDetector,
    riskDetector: mockRiskDetector,
    correctionEngine: mockCorrectionEngine,
  });

  assert(resilientReport.claims.length === 2, "Report still completes despite evidence retrieval error");
  assert(resilientReport.claims[0].evidence.length === 0, "Claim evidence falls back to empty array gracefully");

  // Test 6: Database repository CRUD & in-memory fallback
  console.log("\nTest 6: Database repository operations with in-memory fallback");
  const testId5 = "v-test-5";
  const createdRecord = await createVerification({
    id: testId5,
    original_answer: "Sample answer for DB testing.",
    status: "queued",
    created_at: new Date().toISOString(),
  });
  assert(createdRecord.id === testId5, "createVerification successfully stores record");

  const retrieved = await getVerificationById(testId5);
  assert(retrieved?.id === testId5, "getVerificationById retrieves stored record");
  assert(retrieved?.status === "queued", "Status is correctly preserved");

  // Non-existent ID returns null
  const missingRecord = await getVerificationById("non-existent-id-xyz");
  assert(missingRecord === null, "getVerificationById returns null for unknown ID");

  // Test 7: Unconfigured Supabase client handling
  console.log("\nTest 7: Supabase client safely handles missing credentials");
  const { getSupabaseClient } = await import("../db/supabaseClient");
  const supabase = getSupabaseClient();
  assert(supabase === null, "getSupabaseClient safely returns null when unconfigured without throwing");

  console.log("\n=================================================");
  console.log(` Summary: ${passedTests} passed, ${failedTests} failed.`);
  console.log("=================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPipelineTests().catch((err) => {
  console.error("Pipeline test runner exception:", err);
  process.exit(1);
});
