import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Loader2 } from "lucide-react";

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

    // Validation
    const newErrors: { aName?: string; aDob?: string; bName?: string; bDob?: string } = {};

    if (!aName.trim() || aName.trim().length < 2) {
      newErrors.aName = "Please enter a real name for Person A";
    }

    if (!aDob || !/^\d{4}-\d{2}-\d{2}$/.test(aDob)) {
      newErrors.aDob = "Please enter a valid date (YYYY-MM-DD)";
    }

    if (!bName.trim() || bName.trim().length < 2) {
      newErrors.bName = "Please enter a real name for Person B";
    }

    if (!bDob || !/^\d{4}-\d{2}-\d{2}$/.test(bDob)) {
      newErrors.bDob = "Please enter a valid date (YYYY-MM-DD)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onGenerate(aName, aDob, bName, bDob);
  };

  return (
    <Card className="border-white/10 bg-lf-ink/60 p-6 backdrop-blur">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Person A */}
        <div className="space-y-4 p-4 rounded-lg bg-lf-midnight/30 border border-lf-violet/20">
          <h3 className="font-semibold text-sm text-lf-aurora">Person A</h3>
          <div className="space-y-2">
            <Label htmlFor="aName" className="text-white">Full Name</Label>
            <Input
              id="aName"
              type="text"
              placeholder="e.g., Huynh Duc Tung Nguyen"
              value={aName}
              onChange={(e) => setAName(e.target.value)}
              className={`border-lf-violet/30 bg-lf-midnight/50 text-white placeholder:text-lf-slate ${errors.aName ? "border-red-500" : ""}`}
            />
            {errors.aName && (
              <p className="text-sm text-red-400">{errors.aName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="aDob" className="text-white">Date of Birth</Label>
            <Input
              id="aDob"
              type="date"
              value={aDob}
              onChange={(e) => setADob(e.target.value)}
              className={`border-lf-violet/30 bg-lf-midnight/50 text-white ${errors.aDob ? "border-red-500" : ""}`}
            />
            {errors.aDob && (
              <p className="text-sm text-red-400">{errors.aDob}</p>
            )}
          </div>
        </div>

        {/* Person B */}
        <div className="space-y-4 p-4 rounded-lg bg-lf-midnight/30 border border-lf-violet/20">
          <h3 className="font-semibold text-sm text-lf-aurora">Person B</h3>
          <div className="space-y-2">
            <Label htmlFor="bName" className="text-white">Full Name</Label>
            <Input
              id="bName"
              type="text"
              placeholder="e.g., Sarah Martinez"
              value={bName}
              onChange={(e) => setBName(e.target.value)}
              className={`border-lf-violet/30 bg-lf-midnight/50 text-white placeholder:text-lf-slate ${errors.bName ? "border-red-500" : ""}`}
            />
            {errors.bName && (
              <p className="text-sm text-red-400">{errors.bName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bDob" className="text-white">Date of Birth</Label>
            <Input
              id="bDob"
              type="date"
              value={bDob}
              onChange={(e) => setBDob(e.target.value)}
              className={`border-lf-violet/30 bg-lf-midnight/50 text-white ${errors.bDob ? "border-red-500" : ""}`}
            />
            {errors.bDob && (
              <p className="text-sm text-red-400">{errors.bDob}</p>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full bg-lf-gradient hover:shadow-glow" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Generating Compatibility..." : "Generate Compatibility Reading"}
        </Button>
      </form>

      {!aName && !aDob && !bName && !bDob && (
        <p className="text-sm text-lf-slate text-center mt-4">
          Enter both names and dates of birth to discover your compatibility & synergy.
        </p>
      )}
    </Card>
  );
}
