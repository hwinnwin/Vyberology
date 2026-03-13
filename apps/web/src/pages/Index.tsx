import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useTimeCapture } from "@/features/capture/hooks/useTimeCapture";
import { useTextInput } from "@/features/capture/hooks/useTextInput";
import { CaptureTabs } from "@/features/capture/components/CaptureTabs";
import { Footer } from "@/components/Footer";
import { ReadingRenderer } from "@/components/ReadingRenderer";
import { ChatMessage } from "@/features/capture/components/LumenChat";
import { callVybeReading } from "@/lib/vybeApi";
import { getReadingHistory } from "@/lib/readingHistory";

interface Reading {
  input_text: string;
  normalized_number: string;
  numerology_data: {
    headline: string;
    keywords: string[];
    guidance: string;
  };
  chakra_data: {
    name: string;
    element: string;
    focus: string;
    color: string;
    amplified?: boolean;
    message?: string;
  };
}

const ELEMENT_GLYPHS: Record<string, string> = {
  Fire: "\u{1F702}",
  Earth: "\u{1F703}",
  Air: "\u{1F701}",
  Water: "\u{1F704}",
};

const Index = () => {
  const { toast } = useToast();
  const [combinedReading, setCombinedReading] = useState<Reading | null>(null);
  const [combinedCapturedAt, setCombinedCapturedAt] = useState<string>("");
  const readingRef = useRef<HTMLDivElement>(null);

  const scrollToReading = () => {
    setTimeout(() => {
      readingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const timeCapture = useTimeCapture(
    (reading) => {
      setCombinedReading(reading);
      setCombinedCapturedAt(timeCapture.capturedAt);
      scrollToReading();
    },
    (error) => {
      toast({ title: "Processing failed", description: error.message || "Please try again", variant: "destructive" });
    }
  );

  const textInput = useTextInput(
    (reading) => {
      setCombinedReading(reading);
      setCombinedCapturedAt(textInput.capturedAt);
      scrollToReading();
    },
    (error) => {
      toast({ title: "Processing failed", description: error.message || "Please try again", variant: "destructive" });
    },
    () => {
      toast({ title: "No input", description: "Please enter numbers or text", variant: "destructive" });
    }
  );

  // Lumen chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatProcessing, setIsChatProcessing] = useState(false);

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    const updatedMessages: ChatMessage[] = [...chatMessages, { role: "user", content: userMessage }];
    setChatMessages(updatedMessages);
    setIsChatProcessing(true);

    try {
      // Build context: recent reading history summaries
      const history = getReadingHistory().slice(0, 10);
      const historyContext = history.length > 0
        ? history.map((r) => {
            const date = new Date(r.timestamp).toLocaleDateString();
            // Include a truncated excerpt of the reading for context
            const excerpt = r.reading.slice(0, 300).replace(/\n+/g, " ");
            return `[${date}] ${r.inputType}: "${r.inputValue}" — ${excerpt}`;
          }).join("\n")
        : "No previous readings yet.";

      // Build conversation history for multi-turn context
      const convoContext = updatedMessages.slice(-8).map(
        (m) => `${m.role === "user" ? "User" : "Lumyn"}: ${m.content.slice(0, 400)}`
      ).join("\n");

      const inputs = [
        { label: "ReadingHistory", value: historyContext },
        { label: "Conversation", value: convoContext },
        { label: "Question", value: userMessage },
      ];

      const reading = await callVybeReading(inputs, "standard", "chat");
      setChatMessages((prev) => [...prev, { role: "assistant", content: reading }]);
    } catch (error) {
      toast({
        title: "Chat failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsChatProcessing(false);
    }
  };

  const isProcessing = timeCapture.isProcessing || textInput.isProcessing || isChatProcessing;

  return (
    <div className="min-h-screen flex flex-col bg-vy-parchment grain">
      <OnboardingModal />

      {/* ═══ Hero ═══ */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        {/* Decorative sacred geometry circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-vy-gold/[0.12] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-vy-gold/[0.15] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-vy-gold/[0.18] pointer-events-none" />

        <div className="relative z-10 max-w-[720px] mx-auto">
          <p className="vy-label text-vy-gold mb-6 vy-reveal vy-reveal-1">
            Sacred Numerology
          </p>
          <h1 className="vy-display text-[clamp(48px,10vw,72px)] text-vy-indigo mb-5 vy-reveal vy-reveal-2 vy-hero-heading">
            Vyberology
          </h1>
          <div className="vy-divider max-w-[120px] mx-auto mb-6 vy-reveal vy-reveal-3" />
          <p className="font-sans text-lg font-light text-vy-charcoal/75 max-w-[480px] mx-auto leading-relaxed vy-reveal vy-reveal-4">
            Transform names, birthdates, and repeating numbers into
            personalized numerological guidance.
          </p>
        </div>
      </section>

      {/* ═══ Capture ═══ */}
      <section className="px-6 pb-16">
        <div className="max-w-[640px] mx-auto vy-reveal vy-reveal-5">
          <CaptureTabs
            onTimeCapture={timeCapture.captureTime}
            textValue={textInput.textInput}
            onTextChange={textInput.setTextInput}
            onTextSubmit={textInput.submitText}
            chatMessages={chatMessages}
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            onChatSend={handleChatSend}
            isProcessing={isProcessing}
          />
        </div>
      </section>

      {/* ═══ Reading Result ═══ */}
      {combinedReading && (
        <section ref={readingRef} className="px-6 pb-20">
          <div className="max-w-[640px] mx-auto">
            <div className="vy-divider mb-10" />

            {/* Timestamp */}
            <p className="vy-label text-vy-warm-gray mb-8">
              Captured at {combinedCapturedAt}
            </p>

            {/* Element + Chakra — only show if data exists */}
            {combinedReading.chakra_data.element && (
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl leading-none">
                  {ELEMENT_GLYPHS[combinedReading.chakra_data.element] || "\u{1F701}"}
                </span>
                <span
                  className="vy-label"
                  style={{ color: combinedReading.chakra_data.color }}
                >
                  {combinedReading.chakra_data.element.toUpperCase()}
                </span>
              </div>
            )}

            {combinedReading.chakra_data.name && (
              <div className="flex items-center gap-2 mb-10">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: combinedReading.chakra_data.color }}
                />
                <span className="vy-label text-vy-charcoal">
                  {combinedReading.chakra_data.name.toUpperCase()}
                </span>
              </div>
            )}

            {/* Headline */}
            <h2 className="vy-display text-[28px] sm:text-[32px] text-vy-charcoal mb-8 leading-snug">
              {combinedReading.numerology_data.headline}
            </h2>

            {/* Guidance — rendered with formatted tables and sections */}
            <div className="border border-vy-charcoal/[0.08] rounded-2xl p-6 bg-white/50 backdrop-blur-sm shadow-vy-soft mb-8">
              <ReadingRenderer text={combinedReading.numerology_data.guidance} />
            </div>

            {/* Keywords — only show if array has items */}
            {combinedReading.numerology_data.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {combinedReading.numerology_data.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="font-sans text-xs font-medium px-4 py-1.5 rounded-full bg-vy-charcoal text-vy-parchment"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* Amplified */}
            {combinedReading.chakra_data.amplified && combinedReading.chakra_data.message && (
              <p className="font-sans text-sm italic font-light text-vy-charcoal/70 mb-8">
                {combinedReading.chakra_data.message}
              </p>
            )}

            <Link
              to="/history"
              className="vy-label text-vy-charcoal/60 hover:text-vy-gold transition-colors duration-200"
            >
              View Reading History
            </Link>
          </div>
        </section>
      )}

      {/* ═══ Features ═══ */}
      <section className="bg-vy-charcoal px-6 py-24">
        <div className="max-w-[960px] mx-auto">
          <p className="vy-label text-vy-gold text-center mb-4">Explore</p>
          <h2 className="vy-display text-[36px] text-vy-parchment text-center mb-16">
            Your Numerological Toolkit
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Link to="/lyf-path" className="group no-underline">
              <div className="rounded-2xl border border-vy-parchment/[0.08] bg-vy-parchment/[0.04] p-7 transition-all duration-300 group-hover:border-vy-gold/30 group-hover:bg-vy-parchment/[0.07] group-hover:shadow-vy-glow h-full">
                <div className="w-12 h-12 rounded-xl bg-vy-parchment/[0.08] flex items-center justify-center mb-5 text-vy-parchment text-xl">
                  &#x2609;
                </div>
                <h3 className="font-sans text-lg font-semibold text-vy-parchment mb-2">
                  Lyf Path
                </h3>
                <p className="font-sans text-sm font-light leading-relaxed text-vy-parchment/75">
                  Your birth date decoded into your base frequency, North Node direction, and soul-level attunement.
                </p>
              </div>
            </Link>

            <Link to="/career" className="group no-underline">
              <div className="rounded-2xl border border-vy-parchment/[0.08] bg-vy-parchment/[0.04] p-7 transition-all duration-300 group-hover:border-vy-gold/30 group-hover:bg-vy-parchment/[0.07] group-hover:shadow-vy-glow h-full">
                <div className="w-12 h-12 rounded-xl bg-vy-parchment/[0.08] flex items-center justify-center mb-5 text-vy-parchment text-xl">
                  &#x2692;
                </div>
                <h3 className="font-sans text-lg font-semibold text-vy-parchment mb-2">
                  Career Outlook
                </h3>
                <p className="font-sans text-sm font-light leading-relaxed text-vy-parchment/75">
                  Your numerology numbers decoded into career strengths, professional frequency, and purpose-driven guidance.
                </p>
              </div>
            </Link>

            <Link to="/romance" className="group no-underline">
              <div className="rounded-2xl border border-vy-parchment/[0.08] bg-vy-parchment/[0.04] p-7 transition-all duration-300 group-hover:border-vy-gold/30 group-hover:bg-vy-parchment/[0.07] group-hover:shadow-vy-glow h-full">
                <div className="w-12 h-12 rounded-xl bg-vy-parchment/[0.08] flex items-center justify-center mb-5 text-vy-parchment text-xl">
                  &#x2764;
                </div>
                <h3 className="font-sans text-lg font-semibold text-vy-parchment mb-2">
                  Romance Outlook
                </h3>
                <p className="font-sans text-sm font-light leading-relaxed text-vy-parchment/75">
                  Your soul's romantic frequency revealed — love language, attachment style, and heart-centered guidance.
                </p>
              </div>
            </Link>

            <Link to="/compatibility" className="group no-underline">
              <div className="rounded-2xl border border-vy-parchment/[0.08] bg-vy-parchment/[0.04] p-7 transition-all duration-300 group-hover:border-vy-gold/30 group-hover:bg-vy-parchment/[0.07] group-hover:shadow-vy-glow h-full">
                <div className="w-12 h-12 rounded-xl bg-vy-parchment/[0.08] flex items-center justify-center mb-5 text-vy-parchment text-xl">
                  &#x2661;
                </div>
                <h3 className="font-sans text-lg font-semibold text-vy-parchment mb-2">
                  Compatibility
                </h3>
                <p className="font-sans text-sm font-light leading-relaxed text-vy-parchment/75">
                  Compare two profiles. Discover how your energies interact, where you align, and where tension lives.
                </p>
              </div>
            </Link>

            <Link to="/get-vybe" className="group no-underline">
              <div className="rounded-2xl border border-vy-parchment/[0.08] bg-vy-parchment/[0.04] p-7 transition-all duration-300 group-hover:border-vy-gold/30 group-hover:bg-vy-parchment/[0.07] group-hover:shadow-vy-glow h-full">
                <div className="w-12 h-12 rounded-xl bg-vy-parchment/[0.08] flex items-center justify-center mb-5 text-vy-parchment text-xl">
                  &#x2605;
                </div>
                <h3 className="font-sans text-lg font-semibold text-vy-parchment mb-2">
                  Get Vybe
                </h3>
                <p className="font-sans text-sm font-light leading-relaxed text-vy-parchment/75">
                  Capture repeating numbers from the moment — time or manual input. Decoded in real-time.
                </p>
              </div>
            </Link>

            <Link to="/pricing" className="group no-underline">
              <div className="rounded-2xl border border-vy-parchment/[0.08] bg-vy-parchment/[0.04] p-7 transition-all duration-300 group-hover:border-vy-gold/30 group-hover:bg-vy-parchment/[0.07] group-hover:shadow-vy-glow h-full">
                <div className="w-12 h-12 rounded-xl bg-vy-parchment/[0.08] flex items-center justify-center mb-5 text-vy-parchment text-xl">
                  &#x2736;
                </div>
                <h3 className="font-sans text-lg font-semibold text-vy-parchment mb-2">
                  Premium Readings
                </h3>
                <p className="font-sans text-sm font-light leading-relaxed text-vy-parchment/75">
                  AI-powered deep readings with personalized guidance. Credit packages for unlimited access.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <Footer />
    </div>
  );
};

export default Index;
