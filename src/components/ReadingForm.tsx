import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";

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
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={errors.fullName ? "border-destructive" : ""}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className={errors.dob ? "border-destructive" : ""}
          />
          {errors.dob && (
            <p className="text-sm text-destructive">{errors.dob}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Reading"}
        </Button>
      </form>

      {!fullName && !dob && (
        <p className="text-sm text-muted-foreground text-center mt-4">
          Drop your full name + date of birth. I'll map your numbers & your dominant chakra.
        </p>
      )}
    </Card>
  );
}
