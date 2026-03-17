import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Home, Sparkles, Zap, Crown, Lock } from "lucide-react";
import { CompatibilityForm } from "@/components/CompatibilityForm";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ReadingRenderer } from "@/components/ReadingRenderer";
import { ReadingActions } from "@/components/ReadingActions";
import { Footer } from "@/components/Footer";
import { toast } from "@/hooks/use-toast";
import { saveReading } from "@/lib/readingHistory";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { useReadingCredit, refundReadingCredit } from "@/services/stripe";
import { callVybeReading } from "@/lib/vybeApi";
import { compareProfiles, type PairReading } from "@/lib/numerology/compat";
import { computeAll } from "@/lib/numerology/calculators";
import { semanticsFor, prettyChakra } from "@/lib/numerology/chakraMap";
import { capitalizeName } from "@/lib/numerology/letterMap";

type DepthTier = "lite" | "standard" | "deep";

const TIER_INFO: Record<DepthTier, { label: string; desc: string; icon: React.ReactNode }> = {
  lite: {
    label: "Quick Match",
    desc: "~200 word harmony snapshot",
    icon: <Sparkles className="w-5 h-5" />,
  },
  standard: {
    label: "Full Synastry",
    desc: "~500 word relationship dynamics",
    icon: <Zap className="w-5 h-5" />,
  },
  deep: {
    label: "Soul Contract",
    desc: "~1000 word karmic exploration",
    icon: <Crown className="w-5 h-5" />,
  },
};

const NUM_LABELS = ["Life Path", "Expression", "Soul Urge", "Personality", "Maturity"] as const;

export default function Compatibility() {
  const navigate = useNavigate();
  const { user, credits, refreshCredits } = useAuth();
  const [freeResult, setFreeResult] = useState<PairReading | null>(null);
  const [paidReading, setPaidReading] = useState<string | null>(null);
  const [paidDepth, setPaidDepth] = useState<DepthTier | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ aName: string; aDob: string; bName: string; bDob: string } | null>(null);

  const handleGenerate = (aName: string, aDob: string, bName: string, bDob: string) => {
    setIsCalculating(true);
    setError(null);
    setPaidReading(null);
    setPaidDepth(null);

    try {
      const result = compareProfiles(aName.trim(), aDob.trim(), bName.trim(), bDob.trim());
      setFreeResult(result);
      setFormData({ aName: aName.trim(), aDob: aDob.trim(), bName: bName.trim(), bDob: bDob.trim() });

      void trackAnalyticsEvent("compatibility_free_calculated", { platform: "web" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to calculate compatibility";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePaidGeneration = async (depth: DepthTier) => {
    if (!freeResult || !formData) return;
    setError(null);

    // Check auth
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check credits
    if (credits < 1) {
      toast({ title: "No Credits", description: "Purchase reading credits to unlock premium readings." });
      navigate("/pricing");
      return;
    }

    // Deduct credit
    try {
      const deducted = await useReadingCredit();
      if (!deducted) {
        toast({ title: "Credit Error", description: "Failed to use reading credit.", variant: "destructive" });
        return;
      }
    } catch (err) {
      toast({ title: "Credit Error", description: err instanceof Error ? err.message : "Failed to use credit.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const numbersA = computeAll(formData.aName, formData.aDob);
      const numbersB = computeAll(formData.bName, formData.bDob);
      const semA = semanticsFor(numbersA.lifePath.value);
      const semB = semanticsFor(numbersB.lifePath.value);
      const nameA = capitalizeName(formData.aName);
      const nameB = capitalizeName(formData.bName);

      const elementStr = (sem: typeof semA) =>
        Array.isArray(sem.element)
          ? sem.element.map(e => e[0].toUpperCase() + e.slice(1)).join(" + ")
          : sem.element[0].toUpperCase() + sem.element.slice(1);

      const inputs = [
        { label: "Person A Name", value: nameA },
        { label: "Person A DOB", value: formData.aDob },
        { label: "Person A Life Path", value: `${numbersA.lifePath.value}${numbersA.lifePath.isMaster ? " (Master)" : ""}` },
        { label: "Person A Expression", value: `${numbersA.expression.value}${numbersA.expression.isMaster ? " (Master)" : ""}` },
        { label: "Person A Active Soul Freq.", value: `${numbersA.soulUrge.value}${numbersA.soulUrge.isMaster ? " (Master)" : ""}` },
              { label: "Person A Deep Soul Blueprint", value: `${numbersA.soulUrgeDeep?.value ?? numbersA.soulUrge.value}${numbersA.soulUrgeDeep?.isMaster ? " (Master)" : ""}` },
        { label: "Person A Personality", value: String(numbersA.personality.value) },
        { label: "Person A Maturity", value: String(numbersA.maturity.value) },
        { label: "Person A Chakra", value: prettyChakra(semA.chakra) },
        { label: "Person A Element", value: elementStr(semA) },
        { label: "Person B Name", value: nameB },
        { label: "Person B DOB", value: formData.bDob },
        { label: "Person B Life Path", value: `${numbersB.lifePath.value}${numbersB.lifePath.isMaster ? " (Master)" : ""}` },
        { label: "Person B Expression", value: `${numbersB.expression.value}${numbersB.expression.isMaster ? " (Master)" : ""}` },
        { label: "Person B Active Soul Freq.", value: `${numbersB.soulUrge.value}${numbersB.soulUrge.isMaster ? " (Master)" : ""}` },
              { label: "Person B Deep Soul Blueprint", value: `${numbersB.soulUrgeDeep?.value ?? numbersB.soulUrge.value}${numbersB.soulUrgeDeep?.isMaster ? " (Master)" : ""}` },
        { label: "Person B Personality", value: String(numbersB.personality.value) },
        { label: "Person B Maturity", value: String(numbersB.maturity.value) },
        { label: "Person B Chakra", value: prettyChakra(semB.chakra) },
        { label: "Person B Element", value: elementStr(semB) },
        { label: "Life Path Blend", value: freeResult.synergy.lifePathBlend.code },
        { label: "Life Path Blend Meaning", value: freeResult.synergy.lifePathBlend.summary },
        { label: "Chakra Weave", value: freeResult.synergy.chakraWeave.summary },
      ];

      const readingText = await callVybeReading(inputs, depth, "compatibility");
      setPaidReading(readingText);
      setPaidDepth(depth);
      void refreshCredits();

      saveReading({
        inputType: "manual",
        inputValue: `Compatibility: ${nameA} & ${nameB} (${depth})`,
        reading: readingText,
      });

      void trackAnalyticsEvent("compatibility_paid_generated", { platform: "web", depth });
      toast({ title: "Reading Complete", description: "Your compatibility reading is ready." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate reading";
      setError(msg);
      await refundReadingCredit();
      void refreshCredits();
      toast({ title: "Error", description: `${msg}. Your credit has been refunded.`, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const leftNums = freeResult ? [
    freeResult.left.numbers.lifePath.value,
    freeResult.left.numbers.expression.value,
    freeResult.left.numbers.soulUrge.value,
    freeResult.left.numbers.personality.value,
    freeResult.left.numbers.maturity?.value ?? 0,
  ] : [];

  const rightNums = freeResult ? [
    freeResult.right.numbers.lifePath.value,
    freeResult.right.numbers.expression.value,
    freeResult.right.numbers.soulUrge.value,
    freeResult.right.numbers.personality.value,
    freeResult.right.numbers.maturity?.value ?? 0,
  ] : [];

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
      <header className="text-center px-6 pt-12 pb-8">
        <p className="vy-label text-vy-gold mb-4">Energy Pairing</p>
        <h1 className="vy-display text-[clamp(36px,7vw,48px)] text-vy-charcoal mb-3">
          Compatibility
        </h1>
        <div className="vy-divider max-w-[80px] mx-auto mb-4" />
        <p className="font-sans text-base font-light text-vy-charcoal/50 max-w-[440px] mx-auto">
          Discover how two frequency profiles interact — where you harmonize, where tension sparks growth
        </p>
      </header>

      {/* Form */}
      <section className="max-w-[600px] mx-auto px-6 pb-8 w-full">
        <CompatibilityForm onGenerate={handleGenerate} isLoading={isCalculating} />
      </section>

      {/* Loading free calc */}
      {isCalculating && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Calculating compatibility..." />
        </div>
      )}

      {/* Free Result */}
      {freeResult && !isCalculating && (
        <section className="max-w-[720px] mx-auto px-6 pb-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="vy-divider mb-10" />

          {/* Names */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="font-display text-lg font-semibold text-vy-charcoal">{freeResult.left.fullName}</span>
            <span className="font-display text-xl text-vy-gold">&times;</span>
            <span className="font-display text-lg font-semibold text-vy-charcoal">{freeResult.right.fullName}</span>
          </div>

          {/* Side-by-side number grids */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Person A numbers */}
            <div className="space-y-2">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.1em] text-vy-gold text-center mb-3">
                {freeResult.left.fullName.split(" ")[0]}
              </p>
              {NUM_LABELS.map((label, i) => (
                <div key={label} className="flex items-center justify-between p-2.5 rounded-xl border border-vy-charcoal/[0.06] bg-white/40">
                  <span className="font-sans text-xs text-vy-charcoal/50">{label}</span>
                  <span className="font-display text-lg font-bold text-vy-charcoal">{leftNums[i]}</span>
                </div>
              ))}
            </div>
            {/* Person B numbers */}
            <div className="space-y-2">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.1em] text-vy-gold text-center mb-3">
                {freeResult.right.fullName.split(" ")[0]}
              </p>
              {NUM_LABELS.map((label, i) => (
                <div key={label} className="flex items-center justify-between p-2.5 rounded-xl border border-vy-charcoal/[0.06] bg-white/40">
                  <span className="font-sans text-xs text-vy-charcoal/50">{label}</span>
                  <span className="font-display text-lg font-bold text-vy-charcoal">{rightNums[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Synergy Highlights */}
          <div className="space-y-3 p-5 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm mb-6">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.1em] text-vy-gold mb-3">Synergy Highlights</h3>
            <div className="space-y-2 font-sans text-sm text-vy-charcoal/80">
              <div>
                <span className="font-semibold text-vy-charcoal">Life Path Blend:</span>{" "}
                {freeResult.synergy.lifePathBlend.code} — {freeResult.synergy.lifePathBlend.summary}
              </div>
              <div>
                <span className="font-semibold text-vy-charcoal">Expression:</span>{" "}
                {freeResult.synergy.expressionBlend.code} — {freeResult.synergy.expressionBlend.summary}
              </div>
              <div>
                <span className="font-semibold text-vy-charcoal">Soul Urge:</span>{" "}
                {freeResult.synergy.soulUrgeBlend.code} — {freeResult.synergy.soulUrgeBlend.summary}
              </div>
              {freeResult.synergy.personalityBlend && (
                <div>
                  <span className="font-semibold text-vy-charcoal">Personality:</span>{" "}
                  {freeResult.synergy.personalityBlend.code} — {freeResult.synergy.personalityBlend.summary}
                </div>
              )}
            </div>
          </div>

          {/* Chakra Weave */}
          <div className="p-5 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm mb-6">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.1em] text-vy-gold mb-3">Chakra Weave</h3>
            <p className="font-sans text-sm text-vy-charcoal/80 leading-relaxed">{freeResult.synergy.chakraWeave.summary}</p>
            <div className="flex gap-4 mt-3">
              <div className="font-sans text-xs text-vy-charcoal/50">
                <span className="font-semibold">Dominant:</span> {freeResult.synergy.chakraWeave.dominant}
              </div>
              <div className="font-sans text-xs text-vy-charcoal/50">
                <span className="font-semibold">Bridge:</span> {freeResult.synergy.chakraWeave.bridge}
              </div>
            </div>
          </div>

          {/* Risks */}
          {freeResult.synergy.risks.length > 0 && (
            <div className="p-5 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm mb-6">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.1em] text-vy-charcoal/50 mb-3">Tension Points</h3>
              <ul className="space-y-1.5">
                {freeResult.synergy.risks.map((risk, i) => (
                  <li key={i} className="font-sans text-sm text-vy-charcoal/70 flex gap-2">
                    <span className="text-vy-gold mt-0.5">&#x26A1;</span> {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Plan */}
          {freeResult.actions.focus && (
            <div className="p-5 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm mb-6">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.1em] text-vy-gold mb-1">
                Focus: {freeResult.actions.focus}
              </h3>
              <div className="space-y-2 mt-3">
                {freeResult.actions.actions.map((action, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="font-sans text-xs font-semibold text-vy-charcoal/50 min-w-[80px]">{action.chakra}</span>
                    <span className="font-sans text-sm text-vy-charcoal/80">{action.text}</span>
                  </div>
                ))}
              </div>
              {freeResult.actions.mantra && (
                <p className="font-display text-sm italic text-vy-charcoal/60 text-center mt-4 pt-3 border-t border-vy-charcoal/[0.06]">
                  "{freeResult.actions.mantra}"
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Paid Upgrade CTA */}
      {freeResult && !paidReading && !isGenerating && !isCalculating && (
        <section className="max-w-[720px] mx-auto px-6 pb-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="vy-divider mb-8" />

          <div className="text-center mb-6">
            <h3 className="font-display text-xl font-semibold text-vy-charcoal mb-2">
              Go Deeper
            </h3>
            <p className="font-sans text-sm text-vy-charcoal/50">
              Unlock AI-powered relationship dynamics with personalized guidance
            </p>
            {user && (
              <p className="font-sans text-xs text-vy-gold mt-2">
                {credits} credit{credits !== 1 ? "s" : ""} available
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {(["lite", "standard", "deep"] as DepthTier[]).map((tier) => {
              const info = TIER_INFO[tier];
              return (
                <button
                  key={tier}
                  onClick={() => handlePaidGeneration(tier)}
                  className={`
                    relative text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer bg-white/50 backdrop-blur-sm
                    ${tier === "standard"
                      ? "border-vy-gold/40 shadow-md hover:shadow-lg hover:border-vy-gold/60"
                      : "border-vy-charcoal/[0.08] hover:border-vy-charcoal/20 hover:shadow-md"
                    }
                  `}
                >
                  {tier === "standard" && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 font-sans text-[10px] font-semibold uppercase tracking-[0.1em] px-3 py-0.5 rounded-full bg-vy-gold text-white">
                      Popular
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2 text-vy-charcoal/70">
                    {info.icon}
                    <span className="font-sans text-sm font-semibold text-vy-charcoal">{info.label}</span>
                  </div>
                  <p className="font-sans text-xs text-vy-charcoal/50 mb-3">{info.desc}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-sans text-[10px] text-vy-charcoal/40">1 credit</p>
                    {!user && <Lock className="w-3.5 h-3.5 text-vy-charcoal/30" />}
                  </div>
                </button>
              );
            })}
          </div>

          {!user && (
            <p className="font-sans text-xs text-center text-vy-charcoal/40 mt-4">
              <Link to="/auth" className="underline hover:text-vy-charcoal/60">Sign in</Link> required for premium readings
            </p>
          )}
        </section>
      )}

      {/* Loading paid */}
      {isGenerating && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Channeling your compatibility reading..." />
        </div>
      )}

      {/* Error */}
      {error && !isGenerating && !isCalculating && (
        <section className="max-w-[720px] mx-auto px-6 pb-12">
          <ErrorMessage title="Reading Failed" message={error} onRetry={() => setError(null)} />
        </section>
      )}

      {/* Paid Result */}
      {paidReading && !isGenerating && !error && (
        <section className="max-w-[720px] mx-auto px-6 pb-16 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="vy-divider mb-10" />
          <p className="vy-label text-vy-gold mb-6">
            {paidDepth === "deep" ? "Soul Contract" : paidDepth === "lite" ? "Quick Match" : "Full Synastry"} Reading
          </p>
          <div className="border border-vy-charcoal/[0.08] rounded-2xl p-6 bg-white/50 backdrop-blur-sm shadow-vy-soft mb-8">
            <ReadingRenderer text={paidReading} />
          </div>
          <ReadingActions
            readingText={paidReading}
            title={`Vyberology Compatibility — ${freeResult?.left.fullName} & ${freeResult?.right.fullName}`}
          />
        </section>
      )}

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
