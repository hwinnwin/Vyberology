import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders, securityHeaders, withCors } from "../_shared/security.ts";

const HEADERS: HeadersInit = {
  ...corsHeaders,
  ...securityHeaders,
  "content-type": "application/json; charset=utf-8",
};

interface CheckoutRequest {
  email: string;
  name: string;
  orderOfLight: string;
  dob: string;
  dedication?: string;
  quizResult: {
    finalOrder: string;
    scores: Record<string, number>;
    lifePath: number;
    lumenheart: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: HEADERS,
    });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        { status: 500, headers: HEADERS }
      );
    }

    const body: CheckoutRequest = await req.json();
    const { email, name, orderOfLight, dob, dedication, quizResult } = body;

    if (!email || !name || !orderOfLight || !dob || !quizResult) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: HEADERS }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get the origin for redirect URLs
    const origin = req.headers.get("origin") || "https://vyberology.com";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: "Luminous Legend Book",
              description: `Your personalized ${orderOfLight} legend book PDF`,
              images: ["https://vyberology.com/luminous-preview.png"],
            },
            unit_amount: 3300, // $33.00 AUD - Master Teacher number
          },
          quantity: 1,
        },
      ],
      metadata: {
        name,
        email,
        orderOfLight,
        dob,
        dedication: dedication || "",
        quizResult: JSON.stringify(quizResult),
      },
      success_url: `${origin}/luminous/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/luminous/checkout`,
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      { status: 200, headers: HEADERS }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session", details: message }),
      { status: 500, headers: HEADERS }
    );
  }
};

Deno.serve(withCors(handler));
