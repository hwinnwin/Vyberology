import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface CompatibilityFormProps {
  onGenerate: (aName: string, aDob: string, bName: string, bDob: string) => void;
  isLoading: boolean;
}

export function CompatibilityForm({ onGenerate, isLoading }: CompatibilityFormProps) {
  const [aName, setAName] = useState("");
  const [aDob, setADob] = useState("");
  const [bName, setBName] = useState("");
  const [bDob, setBDob] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aName && aDob && bName && bDob) {
      onGenerate(aName, aDob, bName, bDob);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compatibility Reading</CardTitle>
        <CardDescription>
          Compare two numerology profiles to discover synergy and growth opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Person A */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold text-sm text-muted-foreground">Person A</h3>
            <div className="space-y-2">
              <Label htmlFor="aName">Full Name</Label>
              <Input
                id="aName"
                type="text"
                placeholder="e.g., Huynh Duc Tung Nguyen"
                value={aName}
                onChange={(e) => setAName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aDob">Date of Birth</Label>
              <Input
                id="aDob"
                type="date"
                value={aDob}
                onChange={(e) => setADob(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Person B */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold text-sm text-muted-foreground">Person B</h3>
            <div className="space-y-2">
              <Label htmlFor="bName">Full Name</Label>
              <Input
                id="bName"
                type="text"
                placeholder="e.g., Sarah Martinez"
                value={bName}
                onChange={(e) => setBName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bDob">Date of Birth</Label>
              <Input
                id="bDob"
                type="date"
                value={bDob}
                onChange={(e) => setBDob(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate Compatibility Reading"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
