import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Calculator, Hash, BookOpen, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import vybeLogo from "@/assets/vybe-logo.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lf-midnight via-lf-ink to-lf-midnight">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-lf-gradient opacity-10"></div>
        <div className="container relative mx-auto px-6 py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-lf-aurora" />
              <span className="font-display text-xl font-bold text-lf-aurora">Vyberology</span>
            </div>
            <h1 className="mb-6 font-display text-6xl font-bold leading-tight text-white lg:text-7xl">
              Decode Your Life's Frequency
            </h1>
            <p className="mb-8 text-xl text-lf-slate">
              Turn numbers into resonance. Modern numerology and frequency readings that transform names, birthdates, and repeating numbers into personal guidance.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/numerology">
                <Button className="gap-2 bg-lf-gradient px-8 py-6 text-lg font-semibold shadow-glow hover:shadow-glow-lg">
                  <Calculator className="h-5 w-5" />
                  My Numerology
                </Button>
              </Link>
              <Link to="/compatibility">
                <Button variant="outline" className="gap-2 border-lf-violet px-8 py-6 text-lg text-lf-violet hover:bg-lf-violet/10">
                  <Heart className="h-5 w-5" />
                  Compatibility
                </Button>
              </Link>
              <Link to="/get-vybe">
                <Button variant="outline" className="gap-2 border-lf-violet px-8 py-6 text-lg text-lf-violet hover:bg-lf-violet/10">
                  <img src={vybeLogo} alt="Vybe Logo" className="h-5" />
                  Get Vybe
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="border-white/10 bg-lf-ink/60 p-8 backdrop-blur transition-all hover:border-lf-violet hover:shadow-glow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lf-gradient">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-3 font-display text-2xl font-bold text-white">Numerology Module</h3>
            <p className="text-lf-slate">
              Input your full name and birthdate to reveal your 5 core numbers: Life Path, Expression, Soul Urge, Personality, and Birthday.
            </p>
          </Card>

          <Card className="border-white/10 bg-lf-ink/60 p-8 backdrop-blur transition-all hover:border-lf-violet hover:shadow-glow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lf-gradient">
              <Hash className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-3 font-display text-2xl font-bold text-white">Frequency Readings</h3>
            <p className="text-lf-slate">
              See 1111, 0440, or other repeating numbers? Decode them as frequency codes and capture what was happening in your life.
            </p>
          </Card>

          <Card className="border-white/10 bg-lf-ink/60 p-8 backdrop-blur transition-all hover:border-lf-violet hover:shadow-glow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lf-gradient">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-3 font-display text-2xl font-bold text-white">Frequency Log</h3>
            <p className="text-lf-slate">
              Your personal journal timeline showing captured numbers, meanings, and reflections. Track your journey of alignment.
            </p>
          </Card>
        </div>
      </div>

      {/* Brand Kit Link */}
      <div className="container mx-auto px-6 pb-16">
        <Card className="border-lf-violet bg-lf-gradient p-12 text-center shadow-glow-lg">
          <Sparkles className="mx-auto mb-4 h-12 w-12 text-white" />
          <h2 className="mb-4 font-display text-3xl font-bold text-white">
            Explore the Brand
          </h2>
          <p className="mb-6 text-white/90">
            View our complete brand identity, color system, typography, and design guidelines.
          </p>
          <Link to="/brand">
            <Button className="bg-white font-semibold text-lf-indigo hover:bg-white/90">
              View Brand Kit
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default Index;
