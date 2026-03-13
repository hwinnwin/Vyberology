/**
 * Feedback Service
 * Handles submission of bug reports and feature requests
 */

import { supabase } from "@/integrations/supabase/client";

export type FeedbackType = "bug" | "feature" | "improvement" | "other";
export type FeedbackStatus = "new" | "in_progress" | "completed" | "wont_fix" | "duplicate";

export interface FeedbackSubmission {
  type: FeedbackType;
  title: string;
  description: string;
  email?: string;
  pageUrl?: string;
}

export interface Feedback {
  id: string;
  user_id: string | null;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  email: string | null;
  user_agent: string | null;
  page_url: string | null;
  app_version: string | null;
  browser_info: any;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

/**
 * Submit feedback to the database
 */
export async function submitFeedback(feedback: FeedbackSubmission): Promise<void> {
  try {
    // Get current user (if authenticated)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Gather system context
    const userAgent = navigator.userAgent;
    const appVersion = import.meta.env.VITE_APP_VERSION || "unknown";
    const browserInfo = {
      language: navigator.language,
      platform: navigator.platform,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screenSize: {
        width: window.screen.width,
        height: window.screen.height,
      },
    };

    // Prepare feedback data
    const feedbackData = {
      user_id: user?.id || null,
      type: feedback.type,
      title: feedback.title,
      description: feedback.description,
      email: feedback.email || user?.email || null,
      user_agent: userAgent,
      page_url: feedback.pageUrl || window.location.href,
      app_version: appVersion,
      browser_info: browserInfo,
      status: "new" as FeedbackStatus,
    };

    // Submit to database
    const { error } = await supabase.from("feedback").insert([feedbackData]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }
}

/**
 * Get user's feedback history
 */
export async function getUserFeedback(): Promise<Feedback[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as Feedback[];
  } catch (error) {
    console.error("Error fetching user feedback:", error);
    return [];
  }
}

/**
 * Get feedback statistics (admin only)
 */
export async function getFeedbackStats() {
  try {
    const { data, error } = await supabase.rpc("get_feedback_stats");

    if (error) {
      throw error;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    return null;
  }
}
