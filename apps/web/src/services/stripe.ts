/**
 * Stripe Service
 * Handles Stripe checkout and payment operations
 */

import { supabase } from "@/integrations/supabase/client";

export interface CreateCheckoutSessionParams {
  priceId: string;
  quantity?: number;
  successUrl?: string;
  cancelUrl?: string;
  tier?: string;
  fullName?: string;
  dob?: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

/**
 * Creates a Stripe checkout session
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSession> {
  try {
    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error("You must be logged in to make a purchase");
    }

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: {
          priceId: params.priceId,
          quantity: params.quantity || 1,
          successUrl: params.successUrl,
          cancelUrl: params.cancelUrl,
          ...(params.tier && { tier: params.tier }),
          ...(params.fullName && { fullName: params.fullName }),
          ...(params.dob && { dob: params.dob }),
        },
      }
    );

    if (error) {
      // FunctionsHttpError contains the response; try to extract the actual message
      let msg = error instanceof Error ? error.message : "Checkout failed";
      try {
        if ("context" in error && error.context instanceof Response) {
          const body = await error.context.json();
          msg = body?.error ?? msg;
        }
      } catch { /* ignore parse errors */ }
      console.error("Checkout edge function error:", msg, data);
      throw new Error(msg);
    }

    if (!data || !data.sessionId || !data.url) {
      throw new Error("Invalid response from checkout session");
    }

    return data as CheckoutSession;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

/**
 * Gets the user's reading credits
 */
export async function getUserCredits(): Promise<number> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return 0;
    }

    const { data, error } = await supabase.rpc("get_user_credits", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Error getting user credits:", error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error("Error fetching credits:", error);
    return 0;
  }
}

/**
 * Uses a reading credit
 */
export async function useReadingCredit(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("You must be logged in to use credits");
    }

    const { data, error } = await supabase.rpc("use_reading_credit", {
      p_user_id: user.id,
    });

    if (error) {
      throw error;
    }

    return data === true;
  } catch (error) {
    console.error("Error using credit:", error);
    throw error;
  }
}

/**
 * Refunds a reading credit (reverses useReadingCredit).
 * Call this when AI generation fails after credit was already deducted.
 */
export async function refundReadingCredit(): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.rpc("refund_reading_credit", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Error refunding credit:", error);
    }
  } catch (error) {
    console.error("Error refunding credit:", error);
  }
}

/**
 * Gets the user's purchase history
 */
export async function getPurchaseHistory() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("purchases")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching purchase history:", error);
    return [];
  }
}
