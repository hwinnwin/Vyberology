import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Download, Check, Copy, Palette, Type, Image as ImageIcon, FileText, ArrowLeft, Home } from "lucide-react";
import logoConcept1 from "@/assets/logo-concept-1.png";
import logoConcept2 from "@/assets/logo-concept-2.png";
import logoConcept3 from "@/assets/logo-concept-3.png";

const Brand = () => {
  const navigate = useNavigate();
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const colorPalette = [
    { name: "Ink", token: "--lf-ink", hex: "#0B0E17", hsl: "225 41% 7%", use: "Near-black text / dark backgrounds" },
    { name: "Midnight", token: "--lf-midnight", hex: "#0F1533", hsl: "231 55% 13%", use: "Primary dark background" },
    { name: "Indigo", token: "--lf-indigo", hex: "#4338CA", hsl: "244 58% 51%", use: "Primary brand color" },
    { name: "Violet", token: "--lf-violet", hex: "#7C3AED", hsl: "258 90% 66%", use: "Accent brand color" },
    { name: "Aurora", token: "--lf-aurora", hex: "#A78BFA", hsl: "258 90% 76%", use: "Soft highlight / glow" },
    { name: "Gold", token: "--lf-gold", hex: "#E9D8A6", hsl: "45 58% 78%", use: "Premium accent" },
    { name: "Slate", token: "--lf-slate", hex: "#9AA3B2", hsl: "218 15% 66%", use: "Muted text" },
    { name: "Shell", token: "--lf-shell", hex: "#EEF2FF", hsl: "232 100% 97%", use: "Light surfaces" },
    { name: "White", token: "--lf-white", hex: "#FFFFFF", hsl: "0 0% 100%", use: "Text on dark" },
  ];

  const copyToClipboard = (text: string, colorName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(colorName);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lf-midnight via-lf-ink to-lf-midnight">
      {/* Navigation */}
      <div className="container mx-auto px-6 pt-6">
        <div className="flex items-center justify-between">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="gap-2 text-white hover:text-lf-aurora"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="gap-2 text-white hover:text-lf-aurora"
          >
            <Home className="h-5 w-5" />
            Home
          </Button>
        </div>
      </div>

      {/* Header with gradient */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-lf-gradient opacity-20"></div>
        <div className="container relative mx-auto px-6 py-16">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-lf-aurora" />
                <span className="text-sm font-medium uppercase tracking-wider text-lf-aurora">Brand Kit v1.0</span>
              </div>
              <h1 className="mb-4 font-display text-5xl font-bold text-white lg:text-6xl">
                Vyberology
              </h1>
              <p className="max-w-2xl text-xl text-lf-slate">
                Decode your life's frequency. A complete brand identity for mystical × modern experiences.
              </p>
            </div>
            <Button className="gap-2 bg-lf-gradient font-semibold text-white shadow-glow hover:shadow-glow-lg">
              <Download className="h-4 w-4" />
              Export Brand Kit
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <Tabs defaultValue="logos" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 gap-4 bg-lf-ink/50 p-2 lg:grid-cols-5">
            <TabsTrigger value="logos" className="gap-2 data-[state=active]:bg-lf-gradient data-[state=active]:text-white">
              <Sparkles className="h-4 w-4" />
              Logos
            </TabsTrigger>
            <TabsTrigger value="colors" className="gap-2 data-[state=active]:bg-lf-gradient data-[state=active]:text-white">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="typography" className="gap-2 data-[state=active]:bg-lf-gradient data-[state=active]:text-white">
              <Type className="h-4 w-4" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="components" className="gap-2 data-[state=active]:bg-lf-gradient data-[state=active]:text-white">
              <ImageIcon className="h-4 w-4" />
              Components
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2 data-[state=active]:bg-lf-gradient data-[state=active]:text-white">
              <FileText className="h-4 w-4" />
              Voice & Tone
            </TabsTrigger>
          </TabsList>

          {/* Logos Tab */}
          <TabsContent value="logos" className="space-y-8">
            <Card className="border-white/10 bg-lf-midnight/80 p-8 backdrop-blur">
              <h2 className="mb-6 font-display text-3xl font-bold text-white">Logo Concepts</h2>
              <div className="grid gap-8 md:grid-cols-3">
                {[
                  { img: logoConcept1, title: "Concept 1: Wordmark + Waves" },
                  { img: logoConcept2, title: "Concept 2: Circular Icon" },
                  { img: logoConcept3, title: "Concept 3: Starburst Lockup" },
                ].map((logo, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-lf-ink p-6">
                      <img src={logo.img} alt={logo.title} className="h-auto w-full" />
                    </div>
                    <p className="text-center text-sm font-medium text-lf-slate">{logo.title}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-white/10 bg-lf-midnight/80 p-8 backdrop-blur">
              <h3 className="mb-4 font-display text-2xl font-bold text-white">Usage Guidelines</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold text-lf-aurora">✓ Do's</h4>
                  <ul className="space-y-1 text-sm text-lf-slate">
                    <li>• Use on dark backgrounds for primary lockup</li>
                    <li>• Maintain minimum clear space (logo height × 0.5)</li>
                    <li>• Keep glow effect subtle (20-30% opacity)</li>
                    <li>• Use monochrome versions on busy backgrounds</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-destructive">✗ Don'ts</h4>
                  <ul className="space-y-1 text-sm text-lf-slate">
                    <li>• Don't distort or stretch the logo</li>
                    <li>• Avoid rainbow or harsh neon overlays</li>
                    <li>• Never place on low-contrast backgrounds</li>
                    <li>• Don't use below 32px height (favicon excluded)</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-8">
            <Card className="border-white/10 bg-lf-midnight/80 p-8 backdrop-blur">
              <h2 className="mb-6 font-display text-3xl font-bold text-white">Color Palette</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {colorPalette.map((color) => (
                  <div
                    key={color.name}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-lf-ink p-6 transition-all hover:border-lf-violet"
                  >
                    <div
                      className="mb-4 h-24 w-full rounded-xl shadow-glow"
                      style={{ backgroundColor: color.hex }}
                    ></div>
                    <h3 className="mb-2 font-display text-xl font-bold text-white">{color.name}</h3>
                    <p className="mb-3 text-xs text-lf-slate">{color.use}</p>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => copyToClipboard(color.hex, `${color.name}-hex`)}
                        className="flex w-full items-center justify-between rounded-lg bg-lf-midnight px-3 py-2 text-sm text-lf-slate transition-colors hover:bg-lf-midnight/50"
                      >
                        <span className="font-mono">{color.hex}</span>
                        {copiedColor === `${color.name}-hex` ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(color.token, `${color.name}-token`)}
                        className="flex w-full items-center justify-between rounded-lg bg-lf-midnight px-3 py-2 text-sm text-lf-slate transition-colors hover:bg-lf-midnight/50"
                      >
                        <span className="font-mono text-xs">{color.token}</span>
                        {copiedColor === `${color.name}-token` ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-white/10 bg-lf-midnight/80 p-8 backdrop-blur">
              <h3 className="mb-4 font-display text-2xl font-bold text-white">Gradient System</h3>
              <div className="rounded-2xl bg-lf-gradient p-12 shadow-glow">
                <p className="text-center font-display text-2xl font-bold text-white">
                  Primary Gradient: Indigo → Violet → Aurora
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => copyToClipboard("bg-lf-gradient", "gradient")}
                  className="flex w-full items-center justify-between rounded-lg bg-lf-ink px-4 py-3 text-lf-slate transition-colors hover:bg-lf-midnight"
                >
                  <span className="font-mono text-sm">Tailwind: bg-lf-gradient</span>
                  {copiedColor === "gradient" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-8">
            <Card className="border-white/10 bg-lf-midnight/80 p-8 backdrop-blur">
              <h2 className="mb-6 font-display text-3xl font-bold text-white">Typography System</h2>
              
              <div className="mb-12 space-y-8">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-lf-aurora">Display Font: Fraunces</h3>
                    <span className="text-xs text-lf-slate">Weights: 600, 700</span>
                  </div>
                  <div className="space-y-4 rounded-2xl border border-white/10 bg-lf-ink p-6">
                    <p className="font-display text-5xl font-bold text-white">Vyberology</p>
                    <p className="font-display text-3xl font-semibold text-lf-aurora">Decode Your Life</p>
                    <p className="text-sm text-lf-slate">Use for: Headings, Hero Text, Brand Lockups</p>
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-lf-aurora">Body Font: Inter</h3>
                    <span className="text-xs text-lf-slate">Weights: 400, 500, 600</span>
                  </div>
                  <div className="space-y-4 rounded-2xl border border-white/10 bg-lf-ink p-6">
                    <p className="text-2xl font-semibold text-white">Clean, Modern, Readable</p>
                    <p className="text-base text-lf-slate">
                      Inter provides perfect clarity for UI elements, body text, and interface copy.
                      It scales beautifully across all screen sizes and maintains excellent legibility.
                    </p>
                    <p className="text-sm text-lf-slate">Use for: Body Text, UI Copy, Buttons, Forms</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 font-display text-2xl font-bold text-white">Type Scale</h3>
                <div className="space-y-3 rounded-2xl border border-white/10 bg-lf-ink p-6">
                  <p className="font-display text-5xl font-bold text-white">H1 / Display</p>
                  <p className="font-display text-4xl font-bold text-white">H2 / Title</p>
                  <p className="font-display text-3xl font-semibold text-white">H3 / Subtitle</p>
                  <p className="text-xl font-semibold text-white">H4 / Section</p>
                  <p className="text-base text-lf-slate">Body / Paragraph Text</p>
                  <p className="text-sm text-lf-slate">Small / Caption Text</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-8">
            <Card className="border-white/10 bg-lf-midnight/80 p-8 backdrop-blur">
              <h2 className="mb-6 font-display text-3xl font-bold text-white">UI Components</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="mb-4 text-xl font-semibold text-lf-aurora">Buttons</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-lf-gradient font-semibold shadow-glow hover:shadow-glow-lg">
                      Primary Button
                    </Button>
                    <Button variant="outline" className="border-lf-violet text-lf-violet hover:bg-lf-violet/10">
                      Secondary Button
                    </Button>
                    <Button variant="ghost" className="text-lf-slate hover:text-white">
                      Ghost Button
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-lf-aurora">Cards</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-white/10 bg-lf-ink/60 p-6 backdrop-blur">
                      <div className="mb-2 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-lf-violet" />
                        <h4 className="font-display text-xl font-bold text-white">Frequency 1111</h4>
                      </div>
                      <p className="text-sm text-lf-slate">
                        Gateway of awareness. You're aligned; act on the nudge.
                      </p>
                    </Card>

                    <Card className="border-lf-violet bg-lf-gradient p-6 shadow-glow">
                      <div className="mb-2 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-white" />
                        <h4 className="font-display text-xl font-bold text-white">Premium Card</h4>
                      </div>
                      <p className="text-sm text-white/90">
                        Featured content with gradient background and glow effect.
                      </p>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-lf-aurora">Input Fields</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Enter your name..."
                      className="w-full rounded-xl border border-white/10 bg-lf-ink px-4 py-3 text-white placeholder:text-lf-slate focus:border-lf-violet focus:outline-none focus:ring-2 focus:ring-lf-violet/50"
                    />
                    <textarea
                      placeholder="Add your reflection..."
                      className="w-full rounded-xl border border-white/10 bg-lf-ink px-4 py-3 text-white placeholder:text-lf-slate focus:border-lf-violet focus:outline-none focus:ring-2 focus:ring-lf-violet/50"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Voice & Tone Tab */}
          <TabsContent value="voice" className="space-y-8">
            <Card className="border-white/10 bg-lf-midnight/80 p-8 backdrop-blur">
              <h2 className="mb-6 font-display text-3xl font-bold text-white">Voice & Tone</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="mb-4 text-xl font-semibold text-lf-aurora">Brand Personality</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-lf-ink p-6">
                      <h4 className="mb-2 font-semibold text-white">We are:</h4>
                      <ul className="space-y-1 text-sm text-lf-slate">
                        <li>• Mystical yet approachable</li>
                        <li>• Elevated, luminous, subtle luxury</li>
                        <li>• Warm, guiding, confident</li>
                        <li>• Balanced: spiritual + modern tech</li>
                      </ul>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-lf-ink p-6">
                      <h4 className="mb-2 font-semibold text-white">We avoid:</h4>
                      <ul className="space-y-1 text-sm text-lf-slate">
                        <li>• Preachy or overly serious tones</li>
                        <li>• Complicated jargon</li>
                        <li>• Cold, clinical language</li>
                        <li>• Gimmicky or trendy slang</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-lf-aurora">Key Phrases & Language</h3>
                  <div className="rounded-xl border border-white/10 bg-lf-ink p-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-lf-violet">Core Words</h4>
                        <p className="text-sm text-lf-slate">
                          Frequency · Resonance · Decode · Tune · Align · Signal · Vibration · Light Codes
                        </p>
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-lf-violet">Actions</h4>
                        <p className="text-sm text-lf-slate">
                          Capture · Decode · Tune In · Reflect · Align · Reveal · Discover
                        </p>
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-lf-violet">Feelings</h4>
                        <p className="text-sm text-lf-slate">
                          Luminous · Resonant · Clear · Guided · Aligned · Awakened · Centered
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-lf-aurora">Microcopy Examples</h3>
                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-lf-ink p-6">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-lf-violet">Primary CTA</p>
                      <p className="text-white">Decode My Frequency</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-lf-ink p-6">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-lf-violet">Empty State</p>
                      <p className="text-white">No captures yet. Tune in and add your first frequency.</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-lf-ink p-6">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-lf-violet">Success Message</p>
                      <p className="text-white">✨ Frequency decoded! Your reading is ready.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-lf-aurora">Tagline Options</h3>
                  <div className="space-y-3">
                    {[
                      "Decode your life's frequency.",
                      "Turn numbers into resonance.",
                      "Read the signals. Tune your path.",
                    ].map((tagline, idx) => (
                      <div key={idx} className="rounded-xl border border-white/10 bg-lf-ink p-4">
                        <p className="font-display text-lg text-white">{tagline}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Brand;
