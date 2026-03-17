import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Home, Check, Sparkles, Zap, Crown, X } from "lucide-react";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckoutSession } from "@/services/stripe";
import { useToast } from "@/hooks/use-toast";
import { TIERS, TIER_PRICE_ID, type ReadingTier } from "@/lib/tiers";

const PAID_TIERS: { id: Exclude<ReadingTier, "free">; icon: React.ReactNode; popular?: boolean }[] = [
  { id: "lyf-path", icon: <Sparkles className="w-5 h-5" /> },
  { id: "full-vybe", icon: <Zap className="w-5 h-5" />, popular: true },
  { id: "deep", icon: <Crown className="w-5 h-5" /> },
];

/* Feature comparison rows */
const comparisonFeatures: { label: string; free: boolean | string; lyf: boolean | string; vybe: boolean | string; deep: boolean | string }[] = [
  { label: "Life Path number", free: true, lyf: true, vybe: true, deep: true },
  { label: "Core numbers grid", free: true, lyf: true, vybe: true, deep: true },
  { label: "Chakra + Element ID", free: true, lyf: true, vybe: true, deep: true },
  { label: "Deep Life Path interpretation", free: false, lyf: true, vybe: true, deep: true },
  { label: "Expression + Soul Urge analysis", free: false, lyf: true, vybe: true, deep: true },
  { label: "AI-powered reading", free: false, lyf: "~200 words", vybe: "~500 words", deep: "~1000 words" },
  { label: "Shareable result card", free: false, lyf: true, vybe: true, deep: true },
  { label: "Maturity number analysis", free: false, lyf: false, vybe: true, deep: true },
  { label: "Chakra Flow analysis", free: false, lyf: false, vybe: true, deep: true },
  { label: "Frequency prescription", free: false, lyf: false, vybe: true, deep: true },
  { label: "Downloadable PDF report", free: false, lyf: false, vybe: true, deep: true },
  { label: "Shadow work & keystone actions", free: false, lyf: false, vybe: false, deep: true },
  { label: "Past life echoes", free: false, lyf: false, vybe: false, deep: true },
];

// Maps tier IDs to the reading page that uses credits
const TIER_READING_PAGE: Record<Exclude<ReadingTier, "free">, string> = {
  "lyf-path": "/lyf-path",
  "full-vybe": "/lyf-path",
  deep: "/lyf-path",
};

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, credits } = useAuth();

  const handleAction = async (tierId: Exclude<ReadingTier, "free">) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // If user has credits, navigate to the reading page instead of checkout
    if (credits > 0) {
      navigate(TIER_READING_PAGE[tierId]);
      return;
    }

    setLoading(tierId);
    try {
      const priceId = TIER_PRICE_ID[tierId];
      const successUrl = `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&tier=${tierId}`;
      const cancelUrl = `${window.location.origin}/payment/cancel`;

      const { url } = await createCheckoutSession({
        priceId,
        tier: tierId,
        successUrl,
        cancelUrl,
      });

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const renderCell = (val: boolean | string) => {
    if (val === true) return <Check className="w-4 h-4 text-vy-gold mx-auto" />;
    if (val === false) return <X className="w-4 h-4 text-vy-charcoal/20 mx-auto" />;
    return <span className="font-sans text-xs text-vy-charcoal/70">{val}</span>;
  };

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

      {/* Header */}
      <header className="text-center px-6 pt-12 pb-10">
        <p className="vy-label text-vy-gold mb-4">Premium</p>
        <h1 className="vy-display text-[clamp(36px,7vw,48px)] text-vy-charcoal mb-3">
          Choose Your Reading
        </h1>
        <div className="vy-divider max-w-[80px] mx-auto mb-4" />
        <p className="font-sans text-base font-light text-vy-charcoal/50 max-w-[440px] mx-auto">
          One-time purchase. No subscription. Pick the depth that calls to you.
        </p>
        {!user ? (
          <p className="font-sans text-sm text-vy-charcoal/40 mt-4">
            <Link to="/auth" className="underline text-vy-gold hover:text-vy-gold/80">Sign in</Link> to purchase
          </p>
        ) : credits > 0 ? (
          <p className="font-sans text-sm text-vy-gold mt-4 font-medium">
            You have {credits} credit{credits !== 1 ? "s" : ""} available
          </p>
        ) : null}
      </header>

      {/* Tier Cards */}
      <section className="max-w-[960px] mx-auto px-6 pb-12 w-full">
        <div className="grid sm:grid-cols-3 gap-5">
          {PAID_TIERS.map(({ id, icon, popular }) => {
            const tier = TIERS[id];
            return (
              <div
                key={id}
                className={`relative p-6 rounded-2xl border transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                  popular
                    ? "border-vy-gold/40 shadow-md sm:scale-[1.03]"
                    : "border-vy-charcoal/[0.08]"
                }`}
              >
                {popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 font-sans text-[10px] font-semibold uppercase tracking-[0.1em] px-3 py-0.5 rounded-full bg-vy-gold text-white">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-2 mb-3 text-vy-charcoal/70">
                  {icon}
                  <h3 className="font-sans text-sm font-semibold text-vy-charcoal">{tier.label}</h3>
                </div>

                <p className="font-sans text-xs text-vy-charcoal/50 mb-4">{tier.tagline}</p>

                <div className="mb-5">
                  <span className="font-display text-3xl font-bold text-vy-charcoal">{tier.price}</span>
                  <span className="font-sans text-xs text-vy-charcoal/40 ml-1">one-time</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-vy-gold flex-shrink-0 mt-0.5" />
                      <span className="font-sans text-xs text-vy-charcoal/70">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleAction(id)}
                  disabled={loading !== null}
                  className={`w-full py-3 rounded-xl font-sans text-sm font-medium transition-all duration-200 cursor-pointer border-none ${
                    user && credits > 0
                      ? "bg-vy-gold text-white hover:bg-vy-gold/90"
                      : popular
                        ? "bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90"
                        : "bg-vy-charcoal/[0.06] text-vy-charcoal hover:bg-vy-charcoal/[0.12]"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === id
                    ? "Processing..."
                    : user && credits > 0
                      ? `Use Credit for ${tier.label}`
                      : `Get ${tier.label}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Free tier note */}
      <section className="max-w-[600px] mx-auto px-6 pb-8 text-center">
        <p className="font-sans text-sm text-vy-charcoal/50">
          Just want to see your numbers?{" "}
          <Link to="/lyf-path" className="text-vy-gold hover:text-vy-gold/80 underline">
            Try a free reading
          </Link>{" "}
          — no account needed.
        </p>
      </section>

      {/* Comparison Table */}
      <section className="max-w-[840px] mx-auto px-6 pb-16 w-full">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-vy-charcoal/50 text-center mb-6">
          Compare All Tiers
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-vy-charcoal/[0.08]">
                <th className="font-sans text-xs font-semibold text-vy-charcoal/50 p-4 w-[32%]">Feature</th>
                <th className="font-sans text-xs font-semibold text-vy-charcoal/50 p-4 text-center">Free</th>
                <th className="font-sans text-xs font-semibold text-vy-charcoal/50 p-4 text-center">Lyf Path</th>
                <th className="font-sans text-xs font-semibold text-vy-gold p-4 text-center">Full VYBE</th>
                <th className="font-sans text-xs font-semibold text-vy-charcoal/50 p-4 text-center">Deep</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((row, i) => (
                <tr key={i} className={i < comparisonFeatures.length - 1 ? "border-b border-vy-charcoal/[0.04]" : ""}>
                  <td className="font-sans text-xs text-vy-charcoal/70 p-4">{row.label}</td>
                  <td className="p-4 text-center">{renderCell(row.free)}</td>
                  <td className="p-4 text-center">{renderCell(row.lyf)}</td>
                  <td className="p-4 text-center">{renderCell(row.vybe)}</td>
                  <td className="p-4 text-center">{renderCell(row.deep)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-[600px] mx-auto px-6 pb-16 text-center">
        <div className="p-6 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm">
          <h3 className="font-display text-lg font-semibold text-vy-charcoal mb-3">How it works</h3>
          <p className="font-sans text-sm text-vy-charcoal/60 leading-relaxed">
            Enter your name and date of birth, pick a tier, and pay securely through Stripe.
            Your AI-powered reading is generated instantly and saved to your account forever.
          </p>
        </div>
      </section>

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
