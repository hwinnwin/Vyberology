import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ReadingActions } from "./ReadingActions";
import type { ReadingResult } from "@/lib/numerology";

interface ReadingCardProps {
  result: ReadingResult;
}

export const ReadingCard = memo(function ReadingCard({ result }: ReadingCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Your Numerology Reading</CardTitle>
        <CardDescription>
          {result.input.fullName} · {result.input.dob}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Numbers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-2xl font-bold text-primary">{result.numbers.lifePath.value}</div>
            <div className="text-xs text-muted-foreground">Life Path</div>
            {result.numbers.lifePath.isMaster && (
              <div className="text-xs font-semibold text-primary mt-1">Master</div>
            )}
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-2xl font-bold text-primary">{result.numbers.expression.value}</div>
            <div className="text-xs text-muted-foreground">Expression</div>
            {result.numbers.expression.isMaster && (
              <div className="text-xs font-semibold text-primary mt-1">Master</div>
            )}
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-2xl font-bold text-primary">{result.numbers.soulUrge.value}</div>
            <div className="text-xs text-muted-foreground">Soul Urge</div>
            {result.numbers.soulUrge.isMaster && (
              <div className="text-xs font-semibold text-primary mt-1">Master</div>
            )}
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-2xl font-bold text-primary">{result.numbers.personality.value}</div>
            <div className="text-xs text-muted-foreground">Personality</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-2xl font-bold text-primary">{result.numbers.maturity.value}</div>
            <div className="text-xs text-muted-foreground">Maturity</div>
          </div>
        </div>

        {/* Frequency Profile */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Frequency Profile</h3>
          <p className="text-sm leading-relaxed">{result.reading.frequencyProfile}</p>
        </div>

        {/* Energy Field */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Energy Field</h3>
          <p className="text-sm leading-relaxed">{result.reading.energyField}</p>
        </div>

        {/* Insight */}
        <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
          <h3 className="text-sm font-semibold text-primary">Insight</h3>
          <p className="text-sm leading-relaxed">{result.reading.insight}</p>
        </div>

        {/* Detailed Summary */}
        <div className="space-y-2 p-6 rounded-lg bg-muted/50 border">
          <h3 className="text-lg font-semibold mb-4">Complete Reading</h3>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
            {result.reading.detailedSummary}
          </pre>
        </div>

        {/* Actions */}
        <ReadingActions
          readingText={result.reading.detailedSummary}
          title={`Vyberology Reading - ${result.input.fullName}`}
        />
      </CardContent>
    </Card>
  );
});
