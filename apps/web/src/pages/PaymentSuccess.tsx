import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Home, Check, Sparkles } from "lucide-react";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useLumynEntitlement } from "@/hooks/useLumynEntitlement";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { credits, refreshCredits } = useAuth();
  const { refetch: refetchEntitlement } = useLumynEntitlement();
  const { toast } = useToast();
  const sessionId = searchParams.get("session_id");
  const tier = searchParams.get("tier");
  const upgraded = searchParams.get("upgraded") === "true";
  const [creditsLoading, setCreditsLoading] = useState(true);

  useEffect(() => {
    refreshCredits()
      .catch((err) => console.error("Failed to refresh credits:", err))
      .finally(() => setCreditsLoading(false));
  }, [refreshCredits]);

  useEffect(() => {
    if (upgraded) {
      refetchEntitlement();
    }
  }, [upgraded, refetchEntitlement]);

  useEffect(() => {
    if (upgraded && tier === "lumyn-pro") {
      const timer = setTimeout(() => {
        toast({
          title: "Welcome to Lumyn Pro",
          description: "Enjoy unlimited conversations.",
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [upgraded, tier, toast]);

  const tierLabel =
    tier === "full-vybe"
      ? "Full VYBE Reading"
      : tier === "lyf-path"
        ? "Lyf Path Reading"
        : tier === "lumyn-pro"
          ? "Lumyn Pro"
          : null;

  return (
    <div className="min-h-screen flex flex-col bg-vy-parchment grain">
      {/* Nav */}
      <nav className="max-w-[720px] mx-auto w-full flex justify-between items-center px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-sans text-sm font-medium text-vy-charcoal/50 hover:text-vy-charcoal transition-colors duration-200 bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <Link
          to="/vybe"
          className="flex items-center gap-2 font-sans text-sm font-medium text-vy-charcoal/50 hover:text-vy-charcoal transition-colors duration-200 no-underline"
        >
          <Home size={16} /> Home
        </Link>
      </nav>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-[520px] w-full text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-vy-gold/10 flex items-center justify-center">
            <Check className="w-8 h-8 text-vy-gold" />
          </div>

          <p className="vy-label text-vy-gold mb-3">Confirmed</p>
          <h1 className="vy-display text-[clamp(28px,6vw,36px)] text-vy-charcoal mb-3">
            Payment Successful
          </h1>
          <div className="vy-divider max-w-[80px] mx-auto mb-4" />

          {tier === "lumyn-pro" ? (
            <>
              <p className="font-sans text-base font-light text-vy-charcoal/50 mb-8">
                Welcome to <span className="font-medium text-vy-charcoal/70">Lumyn Pro</span> — unlimited conversations, full memory, and all four modes are now active.
              </p>
              <div className="p-6 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm mb-8 text-left">
                <h3 className="font-display text-lg font-semibold text-vy-charcoal mb-4">What's Next</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-vy-gold flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-sm text-vy-charcoal/60">Unlimited Lumyn conversations with full memory</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-vy-gold flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-sm text-vy-charcoal/60">All four modes: reflect, illuminate, anchor, silent</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-vy-gold flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-sm text-vy-charcoal/60">Reading history integrated into every conversation</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate("/vybe")}
                  className="flex-1 py-3 rounded-xl font-sans text-sm font-medium bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 transition-all duration-200 cursor-pointer border-none"
                >
                  Open Lumyn
                </button>
              </div>
            </>
          ) : (
            <>
              {tierLabel ? (
                <p className="font-sans text-base font-light text-vy-charcoal/50 mb-8">
                  Your <span className="font-medium text-vy-charcoal/70">{tierLabel}</span> credit is ready. Head to Lyf Path to generate your reading.
                </p>
              ) : (
                <p className="font-sans text-base font-light text-vy-charcoal/50 mb-8">
                  Your credits have been added to your account.
                </p>
              )}

              {/* Credits Display */}
              <div className="p-6 rounded-2xl border border-vy-gold/20 bg-white/50 backdrop-blur-sm mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-vy-gold" />
                  <span className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-vy-charcoal/50">
                    Your Balance
                  </span>
                </div>
                <p className="font-display text-4xl font-bold text-vy-charcoal mb-1">
                  {creditsLoading ? "..." : credits}
                </p>
                <p className="font-sans text-sm text-vy-charcoal/40">
                  credit{credits !== 1 ? "s" : ""} available
                </p>
              </div>

              {/* What's Next */}
              <div className="p-6 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm mb-8 text-left">
                <h3 className="font-display text-lg font-semibold text-vy-charcoal mb-4">
                  What's Next
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-vy-gold flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-sm text-vy-charcoal/60">
                      {tierLabel
                        ? `Your ${tierLabel} credit is ready to use`
                        : "Your credits are ready to use across all reading types"}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-vy-gold flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-sm text-vy-charcoal/60">
                      A confirmation email has been sent to your address
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-vy-gold flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-sm text-vy-charcoal/60">
                      Your credits never expire — use them whenever you're ready
                    </span>
                  </li>
                </ul>
              </div>

              {/* Transaction ID */}
              {sessionId && (
                <div className="p-4 rounded-xl bg-vy-charcoal/[0.03] mb-8">
                  <p className="font-sans text-xs text-vy-charcoal/40">
                    Transaction ID:{" "}
                    <span className="font-mono text-[11px] text-vy-charcoal/30">
                      {sessionId}
                    </span>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate("/lyf-path")}
                  className="flex-1 py-3 rounded-xl font-sans text-sm font-medium bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 transition-all duration-200 cursor-pointer border-none"
                >
                  {tierLabel ? `Get Your ${tierLabel.split(" ")[0]} Reading` : "Get Your Reading"}
                </button>
                <button
                  onClick={() => navigate("/history")}
                  className="flex-1 py-3 rounded-xl font-sans text-sm font-medium bg-vy-charcoal/[0.06] text-vy-charcoal hover:bg-vy-charcoal/[0.12] transition-all duration-200 cursor-pointer border-none"
                >
                  View History
                </button>
              </div>

              <button
                onClick={() => navigate("/vybe")}
                className="mt-4 font-sans text-sm text-vy-charcoal/40 hover:text-vy-charcoal/60 transition-colors duration-200 bg-transparent border-none cursor-pointer"
              >
                Return to Home
              </button>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
