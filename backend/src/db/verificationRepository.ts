import "../preload";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseClient";
import { Report, Stage, Evidence, Risk } from "../../../shared/schemas";
import { z } from "zod";

export type StageType = z.infer<typeof Stage>;

export interface VerificationRecord {
  id: string;
  user_id?: string | null;
  session_id?: string | null;
  question?: string | null;
  original_answer: string;
  corrected_answer?: string | null;
  freshness_score?: number | null;
  status: StageType;
  error?: string | null;
  created_at: string;
  report?: Report | null;
}

// In-memory fallback cache for development, testing, and offline modes
const inMemoryStore = new Map<string, VerificationRecord>();

/**
 * Indicates whether the repository is currently operating with a live Supabase
 * database or the in-memory fallback.
 */
export function isUsingLiveSupabase(): boolean {
  return Boolean(isSupabaseConfigured() && getSupabaseClient() !== null);
}

/**
 * Saves a new verification request to the database.
 */
export async function createVerification(
  record: VerificationRecord
): Promise<VerificationRecord> {
  // Always update in-memory cache
  inMemoryStore.set(record.id, { ...record });

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from("verifications").insert({
        id: record.id,
        user_id: record.user_id ?? null,
        session_id: record.session_id ?? null,
        question: record.question ?? null,
        original_answer: record.original_answer,
        corrected_answer: record.corrected_answer ?? null,
        freshness_score: record.freshness_score ?? null,
        status: record.status,
        error: record.error ?? null,
        report_data: record.report ?? null,
        created_at: record.created_at,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("[Repository] Supabase insert error on verifications:", error.message);
      }
    } catch (err: unknown) {
      console.warn("[Repository] Supabase insert exception:", (err as Error).message);
    }
  }

  return inMemoryStore.get(record.id)!;
}

/**
 * Retrieves a verification record by its ID.
 */
export async function getVerificationById(
  id: string
): Promise<VerificationRecord | null> {
  const cached = inMemoryStore.get(id);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("verifications")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        const record: VerificationRecord = {
          id: data.id,
          user_id: data.user_id,
          session_id: data.session_id,
          question: data.question,
          original_answer: data.original_answer,
          corrected_answer: data.corrected_answer,
          freshness_score: data.freshness_score,
          status: data.status as StageType,
          error: data.error,
          created_at: data.created_at,
          report: data.report_data ?? null,
        };

        inMemoryStore.set(id, record);
        return record;
      }
    } catch {
      // Fall through to in-memory return if network or table error
    }
  }

  return cached ?? null;
}

/**
 * Updates an existing verification record (e.g. stage progress or final report).
 */
export async function updateVerification(
  id: string,
  updates: Partial<VerificationRecord>
): Promise<VerificationRecord | null> {
  const existing = inMemoryStore.get(id);
  const updated: VerificationRecord = {
    ...(existing ?? {
      id,
      original_answer: "",
      status: "queued",
      created_at: new Date().toISOString(),
    }),
    ...updates,
  };

  inMemoryStore.set(id, updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.corrected_answer !== undefined) dbUpdates.corrected_answer = updates.corrected_answer;
      if (updates.freshness_score !== undefined) dbUpdates.freshness_score = updates.freshness_score;
      if (updates.error !== undefined) dbUpdates.error = updates.error;
      if (updates.report !== undefined) dbUpdates.report_data = updates.report;

      const { error } = await supabase
        .from("verifications")
        .update(dbUpdates)
        .eq("id", id);

      if (error) {
        console.warn("[Repository] Supabase update error:", error.message);
      }
    } catch (err: unknown) {
      console.warn("[Repository] Supabase update exception:", (err as Error).message);
    }
  }

  return updated;
}

/**
 * Saves relational claim, source, and risk entities into Supabase.
 */
async function saveRelationalReportEntities(
  verificationId: string,
  report: Report
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    // 1. Insert claims
    if (report.claims && report.claims.length > 0) {
      const claimRows = report.claims.map((cr) => ({
        id: cr.claim.id,
        verification_id: verificationId,
        claim_text: cr.claim.text,
        text_span: cr.claim.original_sentence || null,
        entity: cr.claim.entity || null,
        claim_type: cr.claim.type || null,
        in_scope: cr.claim.checkable,
        status: cr.conflict?.verdict || "unverifiable",
        explanation: cr.conflict?.stances?.[0]?.reason || cr.expiry?.reason || null,
        confidence_score: cr.score?.confidence ?? null,
        verified_value: cr.conflict?.stances?.[0]?.quote || null,
        volatility: cr.expiry?.volatility_class || null,
        recheck_after_days: cr.expiry?.recheck_after_days ?? null,
        expires_on: cr.expiry?.expires_on || null,
        reconstruction_text: null,
      }));

      const { error: claimsError } = await supabase
        .from("claims")
        .upsert(claimRows, { onConflict: "verification_id,id" });

      if (claimsError) {
        console.warn("[Repository] Supabase claims upsert error:", claimsError.message);
      }

      // 2. Insert sources
      const sourceRows: Array<{
        verification_id: string;
        claim_id: string;
        title: string;
        url: string;
        source_date: string | null;
        retrieved_at: string;
        snippet: string;
        stance: string | null;
      }> = [];

      for (const cr of report.claims) {
        if (cr.evidence && cr.evidence.length > 0) {
          for (const ev of cr.evidence) {
            sourceRows.push({
              verification_id: verificationId,
              claim_id: cr.claim.id,
              title: ev.title,
              url: ev.url,
              source_date: ev.published_date,
              retrieved_at: ev.retrieved_at,
              snippet: ev.snippet,
              stance: cr.conflict?.stances?.find((s) => s.url === ev.url)?.stance || null,
            });
          }
        }
      }

      if (sourceRows.length > 0) {
        const { error: sourcesError } = await supabase
          .from("sources")
          .insert(sourceRows);

        if (sourcesError) {
          console.warn("[Repository] Supabase sources insert error:", sourcesError.message);
        }
      }
    }

    // 3. Insert risks
    if (report.risks && report.risks.length > 0) {
      const riskRows = report.risks.map((r, idx) => ({
        id: r.id || `r${idx + 1}`,
        verification_id: verificationId,
        claim_id: r.affected_claim_ids?.[0] || null,
        severity: r.severity,
        description: r.description,
      }));

      const { error: risksError } = await supabase
        .from("risk_flags")
        .upsert(riskRows, { onConflict: "verification_id,id" });

      if (risksError) {
        console.warn("[Repository] Supabase risk_flags upsert error:", risksError.message);
      }
    }
  } catch (err: unknown) {
    console.warn("[Repository] Failed saving relational report entities:", (err as Error).message);
  }
}

/**
 * Saves a completed Report to the verification record and its related relational tables.
 */
export async function saveReport(id: string, report: Report): Promise<void> {
  // Update verification master record
  await updateVerification(id, {
    status: "done",
    freshness_score: report.overall_freshness_score,
    corrected_answer: report.correction?.corrected_text ?? null,
    report,
  });

  // Persist child relational tables in Supabase
  await saveRelationalReportEntities(id, report);
}

/**
 * Deletes a verification record by ID from both in-memory cache and Supabase.
 * Useful for integration test cleanup.
 */
export async function deleteVerification(id: string): Promise<boolean> {
  inMemoryStore.delete(id);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from("verifications")
        .delete()
        .eq("id", id);

      if (error) {
        console.warn("[Repository] Supabase delete error:", error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Clears the in-memory cache (for testing purposes).
 */
export function clearInMemoryStore(): void {
  inMemoryStore.clear();
}
