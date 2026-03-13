/**
 * Send Receipt — Sends a branded email receipt after reading generation.
 * Requires RESEND_API_KEY secret to be set.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReceiptPayload {
  readingId: string;
  tier: string;
  fullName: string;
  shareSlug: string;
  amount?: string; // e.g. "$9.97"
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) throw new Error("Invalid or expired token");

    const { readingId, tier, fullName, shareSlug, amount } =
      (await req.json()) as ReceiptPayload;

    const tierLabel =
      tier === "full-vybe"
        ? "Full VYBE Reading"
        : tier === "lyf-path"
          ? "Lyf Path Reading"
          : "Free Teaser";

    const readingUrl = `https://vyberology.com/reading/${readingId}`;
    const shareUrl = shareSlug
      ? `https://vyberology.com/r/${shareSlug}`
      : null;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px;">
    <p style="font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#c4a96a;margin:0 0 24px;">
      Vyberology
    </p>
    <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:600;color:#1e1e1d;margin:0 0 8px;">
      Your Reading is Ready
    </h1>
    <hr style="border:none;border-top:1px solid rgba(30,30,29,0.08);margin:16px 0;" />

    <p style="font-size:14px;color:#1e1e1d;opacity:0.7;line-height:1.6;margin:0 0 24px;">
      Hi ${fullName.split(" ")[0]}, your <strong>${tierLabel}</strong> has been generated.${amount ? ` Payment: <strong>${amount}</strong>.` : ""}
    </p>

    <a href="${readingUrl}" style="display:inline-block;padding:12px 32px;background:#1e1e1d;color:#f5f0e8;font-size:14px;font-weight:500;text-decoration:none;border-radius:12px;">
      View Your Reading
    </a>

    ${
      shareUrl
        ? `<p style="font-size:12px;color:#1e1e1d;opacity:0.4;margin:24px 0 0;">
             Share link: <a href="${shareUrl}" style="color:#c4a96a;">${shareUrl}</a>
           </p>`
        : ""
    }

    <hr style="border:none;border-top:1px solid rgba(30,30,29,0.08);margin:32px 0 16px;" />
    <p style="font-size:11px;color:#1e1e1d;opacity:0.3;margin:0;">
      vyberology.com — Consciousness Technology
    </p>
  </div>
</body>
</html>`.trim();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Vyberology <lumen@hwinnwin.com>",
        to: [user.email],
        subject: `Your ${tierLabel} is Ready`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend API error:", err);
      throw new Error(`Email send failed: ${res.status}`);
    }

    const result = await res.json();

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("send-receipt error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to send receipt",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
