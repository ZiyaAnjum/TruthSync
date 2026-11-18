import "../preload";
import { getSupabaseClient } from "./supabaseClient";
import { Report, Stage } from "../../../shared/schemas";
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
        created_at: record.created_at,
      });

      if (error) {
        console.warn("[Repository] Supabase insert error:", error.message);
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
  if (cached) {
    return cached;
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("verifications")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        return null;
      }

      const record: VerificationRecord = {
        id: data.id,
        user_id: data.user_id,
        session_id: data.session_id,
        question: data.question,
        original_answer: data.original_answer,
        corrected_answer: data.corrected_answer,
        freshness_score: data.freshness_score,
        status: data.status,
        created_at: data.created_at,
        report: data.report_data ?? null,
      };

      inMemoryStore.set(id, record);
      return record;
    } catch {
      return null;
    }
  }

  return null;
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
      const dbUpdates: Record<string, unknown> = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.corrected_answer !== undefined) dbUpdates.corrected_answer = updates.corrected_answer;
      if (updates.freshness_score !== undefined) dbUpdates.freshness_score = updates.freshness_score;

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
 * Saves a completed Report to the verification record.
 */
export async function saveReport(id: string, report: Report): Promise<void> {
  await updateVerification(id, {
    status: "done",
    freshness_score: report.overall_freshness_score,
    corrected_answer: report.correction?.corrected_text ?? null,
    report,
  });
}

/**
 * Clears the in-memory cache (for testing purposes).
 */
export function clearInMemoryStore(): void {
  inMemoryStore.clear();
}
