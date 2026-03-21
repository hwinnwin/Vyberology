/**
 * Builds enriched context for Lumyn chat conversations.
 * Pulls from localStorage reading history, Supabase readings (if logged in),
 * recurring patterns, and user profile data.
 */

import { getReadingHistory, getRecurringPatterns } from "./readingHistory";
import { analyseReadingPatterns } from "./readingInsights";
import { supabase } from "@/integrations/supabase/client";
import type { ChatMessage } from "@/features/capture/components/LumenChat";
import type { LumynInput } from "@/types/lumyn";

/**
 * Build the full context array to send to the vybe-reading edge function in chat mode.
 */
export async function buildLumynContext(
  conversationMessages: ChatMessage[],
  currentQuestion: string
): Promise<LumynInput[]> {
  // 1. Reading history — use full text (up to 800 chars per reading, last 8 readings)
  const localHistory = getReadingHistory().slice(0, 8);
  let historyContext = "No previous readings yet.";

  if (localHistory.length > 0) {
    historyContext = localHistory
      .map((r) => {
        const date = new Date(r.timestamp).toLocaleDateString();
        const excerpt = r.reading.slice(0, 800).replace(/\n+/g, " ");
        return `[${date}] ${r.inputType}: "${r.inputValue}" — ${excerpt}`;
      })
      .join("\n\n");
  }

  // 2. Supabase readings — richer data for logged-in users
  const supabaseReadings = await fetchSupabaseReadings();
  if (supabaseReadings) {
    historyContext += "\n\n--- Detailed Numerology Readings ---\n" + supabaseReadings;
  }

  // 3. Recurring patterns
  const patterns = getRecurringPatterns().slice(0, 5);
  let patternsContext = "";
  if (patterns.length > 0) {
    patternsContext = patterns
      .map((p) => `${p.pattern} (seen ${p.count}x)`)
      .join(", ");
  }

  // 4. Reading pattern intelligence
  const patternSummary = analyseReadingPatterns()

  // 5. User profile (if logged in)
  const profileContext = await fetchUserProfile();

  // 6. Conversation history — last 12 messages, 600 chars each
  const convoContext = conversationMessages
    .slice(-12)
    .map(
      (m) =>
        `${m.role === "user" ? "User" : "Lumyn"}: ${m.content.slice(0, 600)}`
    )
    .join("\n");

  // Build inputs array
  const inputs: LumynInput[] = [
    { label: "ReadingHistory", value: historyContext },
    { label: "Conversation", value: convoContext },
    { label: "Question", value: currentQuestion },
  ];

  // Add optional enrichment inputs
  if (patternsContext) {
    inputs.push({ label: "RecurringPatterns", value: patternsContext });
  }
  if (profileContext) {
    inputs.push({ label: "UserProfile", value: profileContext });
  }
  if (patternSummary.totalReadings > 0) {
    inputs.push({ label: "ReadingPatterns", value: patternSummary.contextSummary });
  }

  return inputs;
}

/**
 * Fetch the user's Supabase-stored readings with full numerology numbers.
 * Returns a formatted string or null if not logged in / no readings.
 */
async function fetchSupabaseReadings(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("readings")
      .select("full_name, dob, numerology_numbers, reading_text, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) return null;

    return data
      .map((r) => {
        const date = r.created_at
          ? new Date(r.created_at).toLocaleDateString()
          : "unknown";
        const nums = (r.numerology_numbers as Record<string, unknown>) ?? {};
        const numLine = [
          nums.life_path && `Life Path: ${nums.life_path}`,
          nums.expression && `Expression: ${nums.expression}`,
          nums.soul_urge && `Soul Urge: ${nums.soul_urge}`,
          nums.personality && `Personality: ${nums.personality}`,
          nums.maturity && `Maturity: ${nums.maturity}`,
        ].filter(Boolean).join(", ");
        const lines = [`[${date}] ${r.full_name} (DOB: ${r.dob})`];
        if (numLine) lines.push(`  ${numLine}`);
        if (r.reading_text) lines.push(`  Reading: ${String(r.reading_text).slice(0, 400)}`);
        return lines.join("\n");
      })
      .join("\n\n");
  } catch {
    return null;
  }
}

/**
 * Fetch the user's profile data (display name, birth info).
 * Returns a formatted string or null.
 */
async function fetchUserProfile(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("user_profiles")
      .select(
        "display_name, birth_year, birth_month, birth_day, total_readings"
      )
      .eq("user_id", user.id)
      .single();

    if (error || !data) return null;

    const parts: string[] = [];
    if (data.display_name) parts.push(`Name: ${data.display_name}`);
    if (data.birth_year && data.birth_month && data.birth_day) {
      parts.push(
        `DOB: ${data.birth_year}-${String(data.birth_month).padStart(2, "0")}-${String(data.birth_day).padStart(2, "0")}`
      );
    }
    if (data.total_readings) parts.push(`Total readings: ${data.total_readings}`);

    return parts.length > 0 ? parts.join(", ") : null;
  } catch {
    return null;
  }
}
