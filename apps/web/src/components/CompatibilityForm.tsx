import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface CompatibilityFormProps {
  onGenerate: (aName: string, aDob: string, bName: string, bDob: string) => void;
  isLoading: boolean;
}

export function CompatibilityForm({ onGenerate, isLoading }: CompatibilityFormProps) {
  const [aName, setAName] = useState("");
  const [aDob, setADob] = useState("");
  const [bName, setBName] = useState("");
  const [bDob, setBDob] = useState("");
  const [errors, setErrors] = useState<{ aName?: string; aDob?: string; bName?: string; bDob?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { aName?: string; aDob?: string; bName?: string; bDob?: string } = {};

    if (!aName.trim() || aName.trim().length < 2) {
      newErrors.aName = "Please enter a full name";
    }
    if (!aDob || !/^\d{4}-\d{2}-\d{2}$/.test(aDob)) {
      newErrors.aDob = "Please enter a valid date";
    }
    if (!bName.trim() || bName.trim().length < 2) {
      newErrors.bName = "Please enter a full name";
    }
    if (!bDob || !/^\d{4}-\d{2}-\d{2}$/.test(bDob)) {
      newErrors.bDob = "Please enter a valid date";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onGenerate(aName, aDob, bName, bDob);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Person A */}
      <div className="space-y-3 p-5 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-vy-gold">Person A</h3>
        <div>
          <Label htmlFor="aName" className="font-sans text-sm font-medium text-vy-charcoal/70 mb-1.5 block">
            Full Name at Birth
          </Label>
          <Input
            id="aName"
            type="text"
            placeholder="e.g. John Michael Smith"
            value={aName}
            onChange={(e) => setAName(e.target.value)}
            className={`w-full bg-white/60 border-vy-charcoal/[0.12] text-vy-charcoal rounded-xl px-4 py-3 font-sans focus:border-vy-gold focus:ring-vy-gold/20 ${errors.aName ? "border-red-400" : ""}`}
          />
          <p className="font-sans text-xs text-vy-charcoal/40 mt-1 italic">
            Birth certificate name including middle names for best accuracy.
          </p>
          {errors.aName && <p className="text-xs text-red-500 mt-1">{errors.aName}</p>}
        </div>
        <div>
          <Label htmlFor="aDob" className="font-sans text-sm font-medium text-vy-charcoal/70 mb-1.5 block">
            Date of Birth
          </Label>
          <Input
            id="aDob"
            type="date"
            value={aDob}
            onChange={(e) => setADob(e.target.value)}
            className={`w-full bg-white/60 border-vy-charcoal/[0.12] text-vy-charcoal rounded-xl px-4 py-3 font-sans focus:border-vy-gold focus:ring-vy-gold/20 ${errors.aDob ? "border-red-400" : ""}`}
          />
          {errors.aDob && <p className="text-xs text-red-500 mt-1">{errors.aDob}</p>}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center">
        <span className="font-display text-2xl text-vy-charcoal/20">&times;</span>
      </div>

      {/* Person B */}
      <div className="space-y-3 p-5 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-vy-gold">Person B</h3>
        <div>
          <Label htmlFor="bName" className="font-sans text-sm font-medium text-vy-charcoal/70 mb-1.5 block">
            Full Name at Birth
          </Label>
          <Input
            id="bName"
            type="text"
            placeholder="e.g. Sarah Jane Martinez"
            value={bName}
            onChange={(e) => setBName(e.target.value)}
            className={`w-full bg-white/60 border-vy-charcoal/[0.12] text-vy-charcoal rounded-xl px-4 py-3 font-sans focus:border-vy-gold focus:ring-vy-gold/20 ${errors.bName ? "border-red-400" : ""}`}
          />
          <p className="font-sans text-xs text-vy-charcoal/40 mt-1 italic">
            Birth certificate name including middle names for best accuracy.
          </p>
          {errors.bName && <p className="text-xs text-red-500 mt-1">{errors.bName}</p>}
        </div>
        <div>
          <Label htmlFor="bDob" className="font-sans text-sm font-medium text-vy-charcoal/70 mb-1.5 block">
            Date of Birth
          </Label>
          <Input
            id="bDob"
            type="date"
            value={bDob}
            onChange={(e) => setBDob(e.target.value)}
            className={`w-full bg-white/60 border-vy-charcoal/[0.12] text-vy-charcoal rounded-xl px-4 py-3 font-sans focus:border-vy-gold focus:ring-vy-gold/20 ${errors.bDob ? "border-red-400" : ""}`}
          />
          {errors.bDob && <p className="text-xs text-red-500 mt-1">{errors.bDob}</p>}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 rounded-xl py-3 font-sans font-medium transition-all duration-200"
        disabled={isLoading}
      >
        {isLoading ? "Calculating..." : "Reveal Compatibility"}
      </Button>
    </form>
  );
}
