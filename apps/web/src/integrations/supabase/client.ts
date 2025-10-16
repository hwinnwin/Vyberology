import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// ====== Initialize Supabase Client ======
// These are public/anon keys only (safe for browser use)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

// Create the main client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// ====== Safe Query Helper ======
/**
 * Wrap Supabase calls with this to get automatic error handling.
 * Example:
 *   const profiles = await safeQuery(() =>
 *     supabase.from("profiles").select("*")
 *   );
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await queryFn();

  if (error) {
    console.error("❌ Supabase error:", error.message || error);
    throw new Error(`Supabase query failed: ${error.message || "Unknown error"}`);
  }

  return data as T;
}