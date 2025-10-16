import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Loader2 } from "lucide-react";

interface ReadingFormProps {
  onGenerate: (fullName: string, dob: string) => void;
  isLoading: boolean;
}

export function ReadingForm({ onGenerate, isLoading }: ReadingFormProps) {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [errors, setErrors] = useState<{ fullName?: string; dob?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { fullName?: string; dob?: string } = {};
    
    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = "Please enter a real name";
    }
    
    if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      newErrors.dob = "Please enter a valid date (YYYY-MM-DD)";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    onGenerate(fullName, dob);
  };

  return (
    <Card className="border-white/10 bg-lf-ink/60 p-6 backdrop-blur">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-white">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={`border-lf-violet/30 bg-lf-midnight/50 text-white placeholder:text-lf-slate ${errors.fullName ? "border-red-500" : ""}`}
          />
          {errors.fullName && (
            <p className="text-sm text-red-400">{errors.fullName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob" className="text-white">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className={`border-lf-violet/30 bg-lf-midnight/50 text-white ${errors.dob ? "border-red-500" : ""}`}
          />
          {errors.dob && (
            <p className="text-sm text-red-400">{errors.dob}</p>
          )}
        </div>

        <Button type="submit" className="w-full bg-lf-gradient hover:shadow-glow" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Generating Your Reading..." : "Generate Reading"}
        </Button>
      </form>

      {!fullName && !dob && (
        <p className="text-sm text-lf-slate text-center mt-4">
          Drop your full name + date of birth. I'll map your numbers & your dominant chakra.
        </p>
      )}
    </Card>
  );
}
