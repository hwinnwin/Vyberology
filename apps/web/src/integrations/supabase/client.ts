import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// ====== Initialize Supabase Client ======
// These are public/anon keys only (safe for browser use)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase configuration missing URL or key");
}

// Create the main client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

type MinimalSupabaseResponse<T> = Promise<{
  data: T | null;
  error: { message?: string } | null;
}>;

// ====== Safe Query Helper ======
/**
 * Wrap Supabase calls with this to get automatic error handling.
 * Example:
 *   const profiles = await safeQuery(() =>
 *     supabase.from("profiles").select("*")
 *   );
 */
export async function safeQuery<T>(
  queryFn: () => MinimalSupabaseResponse<T>
): Promise<T> {
  const { data, error } = await queryFn();

  if (error) {
    const errorMessage =
      typeof error.message === "string" && error.message.length > 0
        ? error.message
        : "Unknown error";
    console.error("❌ Supabase error:", errorMessage);
    throw new Error(`Supabase query failed: ${errorMessage}`);
  }

  if (data === null) {
    throw new Error("Supabase query returned no data");
  }

  return data;
}
