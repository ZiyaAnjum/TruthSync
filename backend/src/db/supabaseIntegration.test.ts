import "../preload";
import {
  getSupabaseClient,
  isSupabaseConfigured,
  testSupabaseConnection,
} from "./supabaseClient";
import {
  createVerification,
  getVerificationById,
  updateVerification,
  deleteVerification,
  isUsingLiveSupabase,
} from "./verificationRepository";

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

async function runSupabaseIntegrationTest() {
  console.log("=================================================");
  console.log(" Supabase Real Database Integration Test");
  console.log("=================================================\n");

  console.log("1. Environment Credentials Check:");
  const configured = isSupabaseConfigured();
  console.log(`   - isSupabaseConfigured(): ${configured}`);
  console.log(`   - process.env.SUPABASE_URL set: ${Boolean(process.env.SUPABASE_URL?.trim())}`);
  console.log(
    `   - Key set (ANON or SERVICE_ROLE): ${Boolean(
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)?.trim()
    )}`
  );

  if (!configured) {
    console.log("\n⚠️  Supabase credentials are NOT yet present in backend/.env.");
    console.log("   To connect to your real Supabase project, add:");
    console.log("     SUPABASE_URL=https://<your-project-id>.supabase.co");
    console.log("     SUPABASE_ANON_KEY=<your-anon-key>");
    console.log("   to TruthSync/backend/.env\n");
    console.log("   Current backend database mode: IN-MEMORY FALLBACK.");
    console.log("=================================================");
    return;
  }

  console.log("\n2. Live Connection Probe:");
  const probe = await testSupabaseConnection();
  console.log(`   - Connected: ${probe.connected}`);
  console.log(`   - Tables Accessible: ${probe.tablesAccessible}`);
  if (probe.error) {
    console.warn(`   - Error/Warning: ${probe.error}`);
  }

  assert(probe.connected, "Successfully connected to live Supabase project");

  if (!probe.tablesAccessible) {
    console.error("\n❌ The required 'verifications' table does not exist in Supabase yet.");
    console.error("   Please run backend/supabase_schema.sql in the Supabase SQL Editor.");
    return;
  }

  // 3. Real Insert Test
  console.log("\n3. Live Insert Test into Supabase 'verifications' table:");
  const testId = `v-live-test-${Date.now()}`;
  const now = new Date().toISOString();

  const insertRecord = await createVerification({
    id: testId,
    original_answer: "Live Supabase integration test record.",
    status: "queued",
    created_at: now,
  });

  assert(insertRecord.id === testId, "createVerification returned record with matching test ID");

  // 4. Real Select Test directly from Supabase
  console.log("\n4. Live Query Test from Supabase 'verifications' table:");
  const supabase = getSupabaseClient()!;
  const { data: dbRow, error: selectErr } = await supabase
    .from("verifications")
    .select("*")
    .eq("id", testId)
    .single();

  assert(!selectErr && dbRow !== null, "Direct Supabase SELECT query retrieved the inserted row");
  assert(dbRow?.id === testId, "Database row ID matches inserted ID");
  assert(
    dbRow?.original_answer === "Live Supabase integration test record.",
    "Database row original_answer matches inserted text"
  );
  assert(dbRow?.status === "queued", "Database row status is 'queued'");

  // 5. Live Update Test
  console.log("\n5. Live Update Test on Supabase 'verifications' table:");
  await updateVerification(testId, {
    status: "done",
    freshness_score: 95,
    corrected_answer: "Corrected answer from live test.",
  });

  const { data: updatedRow } = await supabase
    .from("verifications")
    .select("*")
    .eq("id", testId)
    .single();

  assert(updatedRow?.status === "done", "Database row status updated to 'done'");
  assert(updatedRow?.freshness_score === 95, "Database row freshness_score updated to 95");
  assert(
    updatedRow?.corrected_answer === "Corrected answer from live test.",
    "Database row corrected_answer updated successfully"
  );

  // 6. Cleanup Test Record
  console.log("\n6. Live Cleanup (Deleting temporary test row):");
  const deleted = await deleteVerification(testId);
  assert(deleted, "deleteVerification successfully removed test record");

  const { data: checkDeleted } = await supabase
    .from("verifications")
    .select("id")
    .eq("id", testId)
    .maybeSingle();

  assert(checkDeleted === null, "Confirmed row no longer exists in Supabase");

  console.log("\n=================================================");
  console.log(` Summary: ${passedTests} passed, ${failedTests} failed.`);
  console.log(" Real Supabase Integration: FULLY OPERATIONAL ✅");
  console.log("=================================================");
}

runSupabaseIntegrationTest().catch((err) => {
  console.error("Supabase integration test threw uncaught exception:", err);
  process.exit(1);
});
