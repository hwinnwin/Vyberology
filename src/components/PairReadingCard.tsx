import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ReadingActions } from "./ReadingActions";
import type { PairReading } from "@/lib/numerology/compat";
import { type LegacySemantic } from "@/lib/numerology/chakraMap";

interface PairReadingCardProps {
  reading: PairReading;
}

export const PairReadingCard = memo(function PairReadingCard({ reading }: PairReadingCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Compatibility Reading</CardTitle>
        <CardDescription>
          {reading.left.fullName} × {reading.right.fullName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Individual Numbers Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Person A */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold text-sm">{reading.left.fullName}</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded bg-background">
                <div className="text-lg font-bold text-primary">{reading.left.numbers.lifePath.value}</div>
                <div className="text-xs text-muted-foreground">LP</div>
              </div>
              <div className="text-center p-2 rounded bg-background">
                <div className="text-lg font-bold text-primary">{reading.left.numbers.expression.value}</div>
                <div className="text-xs text-muted-foreground">Expr</div>
              </div>
              <div className="text-center p-2 rounded bg-background">
                <div className="text-lg font-bold text-primary">{reading.left.numbers.soulUrge.value}</div>
                <div className="text-xs text-muted-foreground">Soul</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Dominant: {(reading.left.chakras[0] as LegacySemantic)?.dominant ?? "—"} • Bridge:{" "}
              {(reading.left.chakras[0] as LegacySemantic)?.bridge ?? "—"}
            </div>
          </div>

          {/* Person B */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold text-sm">{reading.right.fullName}</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded bg-background">
                <div className="text-lg font-bold text-primary">{reading.right.numbers.lifePath.value}</div>
                <div className="text-xs text-muted-foreground">LP</div>
              </div>
              <div className="text-center p-2 rounded bg-background">
                <div className="text-lg font-bold text-primary">{reading.right.numbers.expression.value}</div>
                <div className="text-xs text-muted-foreground">Expr</div>
              </div>
              <div className="text-center p-2 rounded bg-background">
                <div className="text-lg font-bold text-primary">{reading.right.numbers.soulUrge.value}</div>
                <div className="text-xs text-muted-foreground">Soul</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Dominant: {(reading.right.chakras[0] as LegacySemantic)?.dominant ?? "—"} • Bridge:{" "}
              {(reading.right.chakras[0] as LegacySemantic)?.bridge ?? "—"}
            </div>
          </div>
        </div>

        {/* Synergy Highlights */}
        <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
          <h3 className="text-sm font-semibold text-primary">Synergy Highlights</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Life Path:</span> {reading.synergy.lifePathBlend.code}
            </div>
            <div>
              <span className="font-semibold">Expression:</span> {reading.synergy.expressionBlend.code}
            </div>
            <div>
              <span className="font-semibold">Chakra Weave:</span> {reading.synergy.chakraWeave.dominant ?? "—"}
            </div>
          </div>
        </div>

        {/* Action Plan */}
        <div className="space-y-4 p-6 rounded-lg bg-primary/5 border border-primary/10">
          <h3 className="text-lg font-semibold text-primary">Action Plan</h3>
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-2">Focus: {reading.actions.focus}</h4>
            </div>
            <div className="space-y-3">
              {reading.actions.actions.map((action, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="font-semibold text-primary text-sm min-w-[100px]">{action.chakra}:</span>
                  <span className="text-sm flex-1">{action.text}</span>
                </div>
              ))}
            </div>
            <p className="italic text-center text-sm mt-4 pt-4 border-t border-primary/20">
              "{reading.actions.mantra}"
            </p>
          </div>
        </div>

        {/* Full Narrative */}
        <div className="space-y-2 p-6 rounded-lg bg-muted/50 border">
          <h3 className="text-lg font-semibold mb-4">Complete Reading</h3>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{reading.narrative}</pre>
        </div>

        {/* Actions */}
        <ReadingActions
          readingText={reading.narrative}
          title={`Compatibility Reading - ${reading.left.fullName} × ${reading.right.fullName}`}
        />
      </CardContent>
    </Card>
  );
});
