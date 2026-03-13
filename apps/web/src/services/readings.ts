import { supabase } from "@/integrations/supabase/client";
import type { ReadingTier } from "@/lib/tiers";

export interface SaveReadingParams {
  tier: ReadingTier;
  fullName: string;
  dob: string;
  numerologyNumbers: Record<string, unknown>;
  semantics?: Record<string, unknown> | null;
  readingText?: string | null;
  readingData?: Record<string, unknown>;
  purchaseId?: string | null;
}

export interface SaveReadingResult {
  id: string;
  share_slug: string;
}

export interface ReadingRow {
  id: string;
  user_id: string;
  purchase_id: string | null;
  tier: ReadingTier;
  full_name: string;
  dob: string;
  numerology_numbers: Record<string, unknown>;
  semantics: Record<string, unknown> | null;
  reading_text: string | null;
  reading_data: Record<string, unknown>;
  share_slug: string | null;
  created_at: string;
  updated_at: string;
}

export async function saveReadingToDb(
  params: SaveReadingParams
): Promise<SaveReadingResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to save a reading");
  }

  const { data, error } = await supabase.rpc("save_reading", {
    p_user_id: user.id,
    p_purchase_id: params.purchaseId ?? null,
    p_tier: params.tier,
    p_full_name: params.fullName,
    p_dob: params.dob,
    p_numerology_numbers: params.numerologyNumbers,
    p_semantics: params.semantics ?? null,
    p_reading_text: params.readingText ?? null,
    p_reading_data: params.readingData ?? {},
  });

  if (error) {
    console.error("Error saving reading:", error);
    throw error;
  }

  return data as unknown as SaveReadingResult;
}

export async function getUserReadings(): Promise<ReadingRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("readings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching readings:", error);
    return [];
  }

  return (data ?? []) as unknown as ReadingRow[];
}

export async function getReadingById(
  id: string
): Promise<ReadingRow | null> {
  const { data, error } = await supabase
    .from("readings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching reading:", error);
    return null;
  }

  return data as unknown as ReadingRow;
}

export async function getReadingBySlug(
  slug: string
): Promise<ReadingRow | null> {
  const { data, error } = await supabase.rpc("get_reading_by_slug", {
    p_slug: slug,
  });

  if (error) {
    console.error("Error fetching reading by slug:", error);
    return null;
  }

  const rows = data as unknown as ReadingRow[];
  return rows?.[0] ?? null;
}
