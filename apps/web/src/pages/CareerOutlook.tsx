import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Home, Sparkles, Crown, Lock, Check, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Footer } from "@/components/Footer";
import { toast } from "@/hooks/use-toast";
import { saveReading } from "@/lib/readingHistory";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { useReadingCredit, refundReadingCredit } from "@/services/stripe";
import { callVybeReading } from "@/lib/vybeApi";
import { saveReadingToDb } from "@/services/readings";
import { computeAll, type NumerologyNumbers } from "@/lib/numerology/calculators";
import { semanticsFor, prettyChakra, prettyElement } from "@/lib/numerology/chakraMap";
import {
  lifePathDescriptions,
  expressionDescriptions,
  soulUrgeDescriptions,
  soulUrgeDeepDescriptions,
  personalityDescriptions,
  maturityDescriptions,
} from "@/lib/numerology/descriptions";
import { capitalizeName } from "@/lib/numerology/letterMap";
import { careerInsights } from "@/lib/numerology/careerInsights";
import { TIERS, TIER_TO_DEPTH, type ReadingTier } from "@/lib/tiers";
import type { Semantic } from "@/lib/numerology/chakraMap";

interface FreeResult {
  fullName: string;
  numbers: NumerologyNumbers;
  description: string;
  semantics: Semantic;
}

const ELEMENT_COLORS: Record<string, string> = {
  fire: "#C4A265",
  earth: "#7A8B6F",
  water: "#5B7B9A",
  air: "#B5838D",
  ether: "#9B8EC4",
};

export default function CareerOutlook() {
  const navigate = useNavigate();
  const { user, credits, refreshCredits } = useAuth();
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [freeResult, setFreeResult] = useState<FreeResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || fullName.trim().length < 2) {
      toast({ title: "Missing name", description: "Please enter your full name at birth", variant: "destructive" });
      return;
    }
    if (!dob) {
      toast({ title: "Missing date", description: "Please enter your date of birth", variant: "destructive" });
      return;
    }

    const numbers = computeAll(fullName.trim(), dob);
    const description = lifePathDescriptions[numbers.lifePath.value] ?? "A unique frequency path.";
    const semantics = semanticsFor(numbers.lifePath.value);

    setFreeResult({ fullName: capitalizeName(fullName), numbers, description, semantics });
    setError(null);

    void trackAnalyticsEvent("career_free_calculated", {
      platform: "web",
      lifePathNumber: numbers.lifePath.value,
      isMaster: numbers.lifePath.isMaster,
    });
  };

  const handlePaidGeneration = async (tier: ReadingTier) => {
    if (!freeResult || tier === "free") return;
    setError(null);

    if (!user) {
      navigate("/auth");
      return;
    }

    if (credits < 1) {
      toast({
        title: "No Credits",
        description: "Purchase reading credits to unlock premium readings.",
      });
      navigate("/pricing");
      return;
    }

    try {
      const deducted = await useReadingCredit();
      if (!deducted) {
        toast({ title: "Credit Error", description: "Failed to use reading credit. Please try again.", variant: "destructive" });
        return;
      }
    } catch (err) {
      toast({ title: "Credit Error", description: err instanceof Error ? err.message : "Failed to use credit.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const elementStr = Array.isArray(freeResult.semantics.element)
        ? freeResult.semantics.element.map(e => e[0].toUpperCase() + e.slice(1)).join(" + ")
        : freeResult.semantics.element[0].toUpperCase() + freeResult.semantics.element.slice(1);

      const { numbers } = freeResult;
      const depth = TIER_TO_DEPTH[tier];

      const inputs = [
        { label: "Full Name at Birth", value: freeResult.fullName },
        { label: "Date of Birth", value: dob },
        { label: "Life Path Number", value: String(numbers.lifePath.value) },
        { label: "Life Path Master", value: numbers.lifePath.isMaster ? "Yes" : "No" },
        { label: "Life Path Meaning", value: freeResult.description },
        { label: "Expression Number", value: String(numbers.expression.value) },
        { label: "Expression Master", value: numbers.expression.isMaster ? "Yes" : "No" },
        { label: "Expression Meaning", value: expressionDescriptions[numbers.expression.value] ?? "A unique expression." },
        { label: "Active Soul Frequency", value: String(numbers.soulUrge.value) },
        { label: "Active Soul Meaning", value: soulUrgeDescriptions[numbers.soulUrge.value] ?? "A deep inner calling." },
        { label: "Deep Soul Blueprint", value: String(numbers.soulUrgeDeep.value) },
        { label: "Deep Soul Meaning", value: soulUrgeDeepDescriptions[numbers.soulUrgeDeep.value] ?? "A deeper hunger shaping your soul's destiny." },
        { label: "Personality Number", value: String(numbers.personality.value) },
        { label: "Personality Meaning", value: personalityDescriptions[numbers.personality.value] ?? "A unique presence." },
        { label: "Maturity Number", value: String(numbers.maturity.value) },
        { label: "Maturity Meaning", value: maturityDescriptions[numbers.maturity.value] ?? "A path of growth." },
        { label: "Primary Chakra", value: prettyChakra(freeResult.semantics.chakra) },
        { label: "Element", value: elementStr },
        { label: "Core Themes", value: freeResult.semantics.themes.join(", ") },
      ];

      const readingText = await callVybeReading(inputs, depth, "career");
      void refreshCredits();

      // Save to localStorage (legacy)
      saveReading({
        inputType: "manual",
        inputValue: `Career Outlook: ${freeResult.fullName}, DOB ${dob} (${tier})`,
        reading: readingText,
      });

      // Save to Supabase and navigate to result page
      const saved = await saveReadingToDb({
        tier,
        fullName: freeResult.fullName,
        dob,
        numerologyNumbers: numbers as unknown as Record<string, unknown>,
        semantics: freeResult.semantics as unknown as Record<string, unknown>,
        readingText,
        readingData: {
          description: freeResult.description,
          elementColor,
          inputs,
        },
      });

      void trackAnalyticsEvent("career_paid_generated", {
        platform: "web",
        tier,
        lifePathNumber: numbers.lifePath.value,
        isMaster: numbers.lifePath.isMaster,
      });

      toast({ title: "Reading Complete", description: "Your career reading is ready." });
      navigate(`/reading/${saved.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate reading";
      setError(msg);
      await refundReadingCredit();
      void refreshCredits();
      void trackAnalyticsEvent("error_occurred", {
        platform: "web",
        scope: "career_paid",
        message: msg,
      });
      toast({ title: "Error", description: `${msg}. Your credit has been refunded.`, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const primaryElement = Array.isArray(freeResult?.semantics.element)
    ? freeResult.semantics.element[0]
    : freeResult?.semantics.element;
  const elementColor = primaryElement ? ELEMENT_COLORS[primaryElement] ?? "#C4A265" : "#C4A265";

  const career = freeResult ? careerInsights[freeResult.numbers.lifePath.value] : null;

  const lyfPathTier = TIERS["lyf-path"];
  const fullVybeTier = TIERS["full-vybe"];

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
          to="/"
          className="flex items-center gap-2 font-sans text-sm font-medium text-vy-charcoal/50 hover:text-vy-charcoal transition-colors duration-200 no-underline"
        >
          <Home size={16} /> Home
        </Link>
      </nav>

      {/* Header */}
      <header className="text-center px-6 pt-12 pb-8">
        <p className="vy-label text-vy-gold mb-4">Career Frequency</p>
        <h1 className="vy-display text-[clamp(36px,7vw,48px)] text-vy-charcoal mb-3">
          Career Outlook
        </h1>
        <div className="vy-divider max-w-[80px] mx-auto mb-4" />
        <p className="font-sans text-base font-light text-vy-charcoal/50 max-w-[440px] mx-auto">
          Your name and birth date reveal your professional frequency — the work your soul was built to do
        </p>
      </header>

      {/* Name + DOB Form */}
      <section className="max-w-[600px] mx-auto px-6 pb-8 w-full">
        <form onSubmit={handleCalculate} className="space-y-4">
          <div>
            <Label htmlFor="fullName" className="font-sans text-sm font-medium text-vy-charcoal/70 mb-2 block">
              Full Name at Birth
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="e.g. John Michael Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white/60 border-vy-charcoal/[0.12] text-vy-charcoal rounded-xl px-4 py-3 font-sans focus:border-vy-gold focus:ring-vy-gold/20"
              required
            />
            <p className="font-sans text-xs text-vy-charcoal/40 mt-1.5 italic">
              Use your full name as it appears on your birth certificate for best accuracy.
            </p>
          </div>
          <div>
            <Label htmlFor="dob" className="font-sans text-sm font-medium text-vy-charcoal/70 mb-2 block">
              Date of Birth
            </Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full bg-white/60 border-vy-charcoal/[0.12] text-vy-charcoal rounded-xl px-4 py-3 font-sans focus:border-vy-gold focus:ring-vy-gold/20"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 rounded-xl py-3 font-sans font-medium transition-all duration-200"
          >
            Reveal My Career Frequency
          </Button>
        </form>
      </section>

      {/* Free Result */}
      {freeResult && (
        <section className="max-w-[720px] mx-auto px-6 pb-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="vy-divider mb-10" />

          {/* Name greeting */}
          <p className="vy-label text-vy-warm-gray text-center mb-6">
            {freeResult.fullName}
          </p>

          {/* Life Path Number — hero display */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-2 mb-4" style={{ borderColor: elementColor }}>
              <span className="font-display text-5xl font-bold text-vy-charcoal">
                {freeResult.numbers.lifePath.value}
              </span>
            </div>
            {freeResult.numbers.lifePath.isMaster && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="font-sans text-xs font-semibold uppercase tracking-[0.12em] px-3 py-1 rounded-full" style={{ backgroundColor: elementColor, color: "#F5F0E8" }}>
                  Master Number
                </span>
              </div>
            )}
            <h2 className="font-display text-2xl font-semibold text-vy-charcoal mt-2">
              {career?.archetype ?? `Life Path ${freeResult.numbers.lifePath.value}`}
            </h2>
          </div>

          {/* Career-specific description */}
          <p className="font-sans text-base leading-relaxed text-vy-charcoal/80 text-center max-w-[500px] mx-auto mb-10">
            {freeResult.description}
          </p>

          {/* Core Numbers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {(() => {
              const su = freeResult.numbers.soulUrge;
              const sud = freeResult.numbers.soulUrgeDeep;
              const unified = su.value === sud.value;
              const baseCards = [
                { label: "Expression", num: freeResult.numbers.expression, desc: expressionDescriptions },
                { label: "Personality", num: freeResult.numbers.personality, desc: personalityDescriptions },
                { label: "Maturity", num: freeResult.numbers.maturity, desc: maturityDescriptions },
              ];
              const soulCards = unified
                ? [{ label: "Soul Urge", num: su, desc: soulUrgeDescriptions }]
                : [
                    { label: "Active Soul Freq.", num: su, desc: soulUrgeDescriptions },
                    { label: "Deep Soul Blueprint", num: sud, desc: soulUrgeDeepDescriptions },
                  ];
              return [...soulCards, ...baseCards];
            })().map(({ label, num, desc }) => (
              <div
                key={label}
                className="relative text-center p-4 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm"
              >
                <span className="font-display text-3xl font-bold text-vy-charcoal">
                  {num.value}
                </span>
                {num.isMaster && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vy-gold" title="Master Number" />
                )}
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">
                  {label}
                </p>
                <p className="font-sans text-[11px] leading-snug text-vy-charcoal/40 mt-2">
                  {desc[num.value]?.split("–")[0]?.split("—")[0]?.trim() || ""}
                </p>
              </div>
            ))}
          </div>

          {/* Chakra + Element badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-vy-charcoal/[0.08] bg-white/50">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: elementColor }} />
              <span className="font-sans text-sm font-medium text-vy-charcoal/80">
                {prettyChakra(freeResult.semantics.chakra)}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-vy-charcoal/[0.08] bg-white/50">
              <span className="font-sans text-sm font-medium text-vy-charcoal/80">
                {prettyElement(freeResult.semantics.element)}
              </span>
            </div>
          </div>

          {/* Career Frequency Insights */}
          {career && (
            <div className="rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4 text-vy-gold" />
                <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.08em] text-vy-charcoal/60">
                  Career Frequency Insights
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {career.strengths.map((s, i) => (
                  <span
                    key={i}
                    className="font-sans text-xs font-medium px-4 py-1.5 rounded-full bg-vy-charcoal text-vy-parchment"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p className="font-sans text-sm leading-relaxed text-vy-charcoal/70">
                {career.idealEnvironments}
              </p>
            </div>
          )}

          {/* Theme keywords */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {freeResult.semantics.themes.map((theme, i) => (
              <span
                key={i}
                className="font-sans text-xs font-medium px-4 py-1.5 rounded-full bg-vy-charcoal/10 text-vy-charcoal/70"
              >
                {theme}
              </span>
            ))}
          </div>

          {/* Note */}
          <p className="font-display text-base italic text-vy-charcoal/60 text-center mb-8">
            {freeResult.semantics.note}
          </p>
        </section>
      )}

      {/* Locked Previews + Upgrade CTA */}
      {freeResult && !isGenerating && (
        <section className="max-w-[720px] mx-auto px-6 pb-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="vy-divider mb-8" />

          {/* Locked preview — blurred content teaser */}
          <div className="relative mb-10 rounded-2xl border border-vy-charcoal/[0.08] bg-white/30 overflow-hidden">
            <div className="blur-[6px] pointer-events-none select-none p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-vy-gold/20" />
                <div>
                  <div className="h-3 w-40 bg-vy-charcoal/20 rounded" />
                  <div className="h-2 w-24 bg-vy-charcoal/10 rounded mt-1.5" />
                </div>
              </div>
              <div className="h-2.5 w-full bg-vy-charcoal/10 rounded" />
              <div className="h-2.5 w-5/6 bg-vy-charcoal/10 rounded" />
              <div className="h-2.5 w-4/6 bg-vy-charcoal/10 rounded" />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="h-16 bg-vy-gold/5 rounded-xl" />
                <div className="h-16 bg-vy-gold/5 rounded-xl" />
              </div>
              <div className="h-2.5 w-full bg-vy-charcoal/10 rounded" />
              <div className="h-2.5 w-3/4 bg-vy-charcoal/10 rounded" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-vy-parchment/60 backdrop-blur-[1px]">
              <Lock className="w-8 h-8 text-vy-charcoal/30 mb-3" />
              <p className="font-sans text-sm font-semibold text-vy-charcoal/70 mb-1">
                Your full Career Blueprint is ready
              </p>
              <p className="font-sans text-xs text-vy-charcoal/40">
                Professional archetype, wealth patterns, and AI-powered career guidance
              </p>
            </div>
          </div>

          {/* Tier heading */}
          <div className="text-center mb-6">
            <h3 className="font-display text-xl font-semibold text-vy-charcoal mb-2">
              Unlock Your Career Reading
            </h3>
            <p className="font-sans text-sm text-vy-charcoal/50">
              Choose your depth of insight — 1 credit per reading
            </p>
            {user && (
              <p className="font-sans text-xs text-vy-gold mt-2">
                {credits} credit{credits !== 1 ? "s" : ""} available
              </p>
            )}
          </div>

          {/* 2-Tier Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Lyf Path Reading — $9.97 */}
            <button
              onClick={() => handlePaidGeneration("lyf-path")}
              disabled={isGenerating}
              className="relative text-left p-6 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm transition-all duration-200 cursor-pointer hover:border-vy-charcoal/20 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2 mb-3 text-vy-charcoal/70">
                <Sparkles className="w-5 h-5" />
                <span className="font-sans text-sm font-semibold text-vy-charcoal">Career Reading</span>
              </div>
              <p className="font-sans text-xs text-vy-charcoal/50 mb-4">Your professional frequency decoded</p>

              <ul className="space-y-2 mb-5">
                {["Career archetype analysis", "Professional strengths mapping", "Work style insights", "AI-powered career reading (~200 words)", "Shareable result card"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-vy-gold flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-xs text-vy-charcoal/70">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-bold text-vy-charcoal">{lyfPathTier.price}</span>
                {!user && <Lock className="w-3.5 h-3.5 text-vy-charcoal/30" />}
              </div>
              <p className="font-sans text-[10px] text-vy-charcoal/40 mt-1">1 credit</p>
            </button>

            {/* Full VYBE Reading — $19.97 */}
            <button
              onClick={() => handlePaidGeneration("full-vybe")}
              disabled={isGenerating}
              className="relative text-left p-6 rounded-2xl border-2 border-vy-gold/40 bg-white/50 backdrop-blur-sm shadow-md transition-all duration-200 cursor-pointer hover:shadow-lg hover:border-vy-gold/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 font-sans text-[10px] font-semibold uppercase tracking-[0.1em] px-3 py-0.5 rounded-full bg-vy-gold text-white">
                Most Popular
              </span>

              <div className="flex items-center gap-2 mb-3 text-vy-charcoal/70">
                <Crown className="w-5 h-5" />
                <span className="font-sans text-sm font-semibold text-vy-charcoal">Full Career Blueprint</span>
              </div>
              <p className="font-sans text-xs text-vy-charcoal/50 mb-4">Complete professional energetic blueprint</p>

              <ul className="space-y-2 mb-5">
                {["Everything in Career Reading", "Wealth pattern analysis", "Professional North Node guidance", "Leadership style deep-dive", "AI-powered deep reading (~500 words)", "Premium shareable card"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-vy-gold flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-xs text-vy-charcoal/70">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-bold text-vy-charcoal">{fullVybeTier.price}</span>
                {!user && <Lock className="w-3.5 h-3.5 text-vy-charcoal/30" />}
              </div>
              <p className="font-sans text-[10px] text-vy-charcoal/40 mt-1">1 credit</p>
            </button>
          </div>

          {!user && (
            <p className="font-sans text-xs text-center text-vy-charcoal/40 mt-4">
              <Link to="/auth" className="underline hover:text-vy-charcoal/60">Sign in</Link> required for premium readings
            </p>
          )}

          {/* Sticky CTA for mobile */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-vy-parchment/95 backdrop-blur-md border-t border-vy-charcoal/[0.08] z-40">
            <button
              onClick={() => handlePaidGeneration("full-vybe")}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl font-sans text-sm font-medium bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 transition-all duration-200 cursor-pointer border-none disabled:opacity-50"
            >
              Unlock Full Career Blueprint — {fullVybeTier.price}
            </button>
          </div>
        </section>
      )}

      {/* Loading */}
      {isGenerating && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Channeling your career reading..." />
        </div>
      )}

      {/* Error */}
      {error && !isGenerating && (
        <section className="max-w-[720px] mx-auto px-6 pb-12">
          <ErrorMessage title="Reading Generation Failed" message={error} onRetry={() => setError(null)} />
        </section>
      )}

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
