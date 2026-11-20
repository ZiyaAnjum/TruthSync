import "../preload";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let clientInstance: SupabaseClient | null = null;
let clientInitialized = false;

/**
 * Checks whether Supabase environment variables are present.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL?.trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY
  )?.trim();

  return Boolean(url && key);
}

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
      console.log("[Database] Supabase client initialized.");
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
 * Actively probes the Supabase connection by executing a lightweight query on the verifications table.
 * Never prints or leaks keys.
 */
export async function testSupabaseConnection(): Promise<{
  configured: boolean;
  connected: boolean;
  tablesAccessible: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      tablesAccessible: false,
      error: "SUPABASE_URL and/or SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) are missing from backend/.env.",
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      configured: true,
      connected: false,
      tablesAccessible: false,
      error: "Failed to construct Supabase client instance.",
    };
  }

  try {
    // Probe the verifications table with a 1-row limit query
    const { data, error } = await client.from("verifications").select("id").limit(1);

    if (error) {
      // Check if the error is that the table does not exist
      if (error.code === "42P01" || error.message.toLowerCase().includes("does not exist")) {
        return {
          configured: true,
          connected: true,
          tablesAccessible: false,
          error: "Connected to Supabase, but the 'verifications' table does not exist yet. Please run backend/supabase_schema.sql in the Supabase SQL Editor.",
        };
      }

      return {
        configured: true,
        connected: false,
        tablesAccessible: false,
        error: `Supabase query error (${error.code || "UNKNOWN"}): ${error.message}`,
      };
    }

    return {
      configured: true,
      connected: true,
      tablesAccessible: true,
    };
  } catch (err: unknown) {
    return {
      configured: true,
      connected: false,
      tablesAccessible: false,
      error: `Connection failure: ${(err as Error).message}`,
    };
  }
}

/**
 * Resets the cached client instance (useful for unit testing).
 */
export function resetSupabaseClient(): void {
  clientInstance = null;
  clientInitialized = false;
}
