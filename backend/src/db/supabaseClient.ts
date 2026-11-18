import "../preload";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let clientInstance: SupabaseClient | null = null;
let clientInitialized = false;

/**
 * Returns a configured Supabase client if SUPABASE_URL and key are available.
 * Returns null if not configured, allowing fallback to in-memory persistence.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (clientInitialized) {
    return clientInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY
  )?.trim();

  if (supabaseUrl && supabaseKey) {
    try {
      clientInstance = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
        },
      });
      console.log("[Database] Supabase client initialized successfully.");
    } catch (err: unknown) {
      console.warn("[Database] Failed to initialize Supabase client:", (err as Error).message);
      clientInstance = null;
    }
  } else {
    // Supabase credentials not yet supplied in environment
    clientInstance = null;
  }

  clientInitialized = true;
  return clientInstance;
}

/**
 * Resets the cached client instance (useful for unit testing).
 */
export function resetSupabaseClient(): void {
  clientInstance = null;
  clientInitialized = false;
}
