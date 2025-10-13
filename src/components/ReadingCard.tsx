import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ReadingActions } from "./ReadingActions";
import type { ReadingResult } from "@/lib/numerology";

interface ReadingCardProps {
  result: ReadingResult;
}

export const ReadingCard = memo(function ReadingCard({ result }: ReadingCardProps) {
  return (
    <Card className="border-lf-violet/30 bg-lf-ink/60 overflow-hidden backdrop-blur transition-all hover:border-lf-violet hover:shadow-glow">
      <CardHeader>
        <CardTitle className="text-white font-display text-3xl">Your Numerology Reading</CardTitle>
        <CardDescription className="text-lf-slate text-lg">
          {result.input.fullName} · {result.input.dob}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Numbers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 rounded-lg bg-lf-midnight/50 border border-lf-violet/20 transition-all hover:border-lf-violet/50">
            <div className="text-3xl font-bold text-lf-aurora">{result.numbers.lifePath.value}</div>
            <div className="text-xs text-lf-slate mt-1">Life Path</div>
            {result.numbers.lifePath.isMaster && (
              <div className="text-xs font-semibold text-lf-violet mt-1">Master</div>
            )}
          </div>
          <div className="text-center p-4 rounded-lg bg-lf-midnight/50 border border-lf-violet/20 transition-all hover:border-lf-violet/50">
            <div className="text-3xl font-bold text-lf-aurora">{result.numbers.expression.value}</div>
            <div className="text-xs text-lf-slate mt-1">Expression</div>
            {result.numbers.expression.isMaster && (
              <div className="text-xs font-semibold text-lf-violet mt-1">Master</div>
            )}
          </div>
          <div className="text-center p-4 rounded-lg bg-lf-midnight/50 border border-lf-violet/20 transition-all hover:border-lf-violet/50">
            <div className="text-3xl font-bold text-lf-aurora">{result.numbers.soulUrge.value}</div>
            <div className="text-xs text-lf-slate mt-1">Soul Urge</div>
            {result.numbers.soulUrge.isMaster && (
              <div className="text-xs font-semibold text-lf-violet mt-1">Master</div>
            )}
          </div>
          <div className="text-center p-4 rounded-lg bg-lf-midnight/50 border border-lf-violet/20 transition-all hover:border-lf-violet/50">
            <div className="text-3xl font-bold text-lf-aurora">{result.numbers.personality.value}</div>
            <div className="text-xs text-lf-slate mt-1">Personality</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-lf-midnight/50 border border-lf-violet/20 transition-all hover:border-lf-violet/50">
            <div className="text-3xl font-bold text-lf-aurora">{result.numbers.maturity.value}</div>
            <div className="text-xs text-lf-slate mt-1">Maturity</div>
          </div>
        </div>

        {/* Frequency Profile */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-lf-aurora">Frequency Profile</h3>
          <p className="text-sm leading-relaxed text-white">{result.reading.frequencyProfile}</p>
        </div>

        {/* Energy Field */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-lf-aurora">Energy Field</h3>
          <p className="text-sm leading-relaxed text-white">{result.reading.energyField}</p>
        </div>

        {/* Insight */}
        <div className="space-y-2 p-4 rounded-lg bg-lf-violet/20 border border-lf-violet">
          <h3 className="text-sm font-semibold text-lf-aurora">Insight</h3>
          <p className="text-sm leading-relaxed text-white">{result.reading.insight}</p>
        </div>

        {/* Detailed Summary */}
        <div className="space-y-2 p-6 rounded-lg bg-lf-midnight/50 border border-lf-violet/30">
          <h3 className="text-lg font-semibold mb-4 text-lf-aurora font-display">Complete Reading</h3>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-white">
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
