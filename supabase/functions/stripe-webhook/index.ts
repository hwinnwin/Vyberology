import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { securityHeaders } from "../_shared/security.ts";

const HEADERS: HeadersInit = {
  ...securityHeaders,
  "content-type": "application/json; charset=utf-8",
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: HEADERS,
    });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecretKey || !webhookSecret) {
    console.error("Stripe configuration missing");
    return new Response(
      JSON.stringify({ error: "Webhook not configured" }),
      { status: 500, headers: HEADERS }
    );
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase configuration missing");
    return new Response(
      JSON.stringify({ error: "Database not configured" }),
      { status: 500, headers: HEADERS }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(
      JSON.stringify({ error: "Missing signature" }),
      { status: 400, headers: HEADERS }
    );
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extract metadata
      const metadata = session.metadata || {};
      const { name, email, orderOfLight, dob, dedication, quizResult } = metadata;

      // Initialize Supabase client with service role
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Store the order
      const { error: insertError } = await supabase.from("orders").insert({
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        email: email || session.customer_email,
        name: name || "Unknown",
        order_of_light: orderOfLight || "Unknown",
        dob: dob || null,
        dedication: dedication || null,
        quiz_result: quizResult ? JSON.parse(quizResult) : null,
        amount_total: session.amount_total,
        currency: session.currency,
        status: "completed",
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error("Failed to insert order:", insertError);
        // Don't fail the webhook - Stripe needs 200 response
      } else {
        console.log(`Order saved for ${email}, session ${session.id}`);
      }

      // TODO: Trigger email with PDF download link
      // This could call another edge function or use a service like Resend
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: HEADERS,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Webhook failed", details: message }),
      { status: 400, headers: HEADERS }
    );
  }
});
