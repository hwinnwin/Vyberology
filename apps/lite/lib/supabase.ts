import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Reading } from "./types";

let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase credentials not configured");
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

/**
 * Save a reading to the database
 */
export async function saveReading(reading: {
  input_time: string;
  core_number: number;
  element: string;
  reading_text: string;
  user_id?: string | null;
}): Promise<Reading | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("readings")
      .insert([reading])
      .select()
      .single();

    if (error) {
      console.error("Error saving reading:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Supabase not configured:", err);
    return null;
  }
}

/**
 * Fetch reading history (most recent first)
 */
export async function getReadingHistory(limit = 10): Promise<Reading[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("readings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching history:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Supabase not configured:", err);
    return [];
  }
}

/**
 * Delete a reading by ID
 */
export async function deleteReading(id: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("readings").delete().eq("id", id);

    if (error) {
      console.error("Error deleting reading:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Supabase not configured:", err);
    return false;
  }
}
