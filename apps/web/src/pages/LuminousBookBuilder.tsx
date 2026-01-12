import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { orders } from "@/features/luminous/data";
import { resolveLuminousBook } from "@/features/luminous/bookTemplate";
import { ResolvedBook, ResolvedBlock, ResolvedSection, QuizResult } from "@/features/luminous/types";

interface BuilderState {
  quizResult?: QuizResult;
  dob?: string;
}

const mergeResolvedBook = (next: ResolvedBook, current: ResolvedBook | null): ResolvedBook => {
  if (!current) return next;

  const mergedSections: ResolvedSection[] = next.sections.map((section) => {
    const existingSection = current.sections.find((item) => item.id === section.id);
    const blocks: ResolvedBlock[] = section.blocks.map((block) => {
      const existingBlock = existingSection?.blocks.find((item) => item.id === block.id);
      if (existingBlock && existingBlock.edited) {
        return { ...existingBlock, defaultValue: block.defaultValue };
      }
      return block;
    });

    return { ...section, blocks };
  });

  return { ...next, sections: mergedSections };
};

const LuminousBookBuilder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as BuilderState) || {};
  const [quizResult] = useState<QuizResult | null>(state.quizResult ?? null);
  const [dob] = useState(state.dob ?? "");
  const [userName, setUserName] = useState("Seeker");
  const [resolvedBook, setResolvedBook] = useState<ResolvedBook | null>(
    quizResult ? resolveLuminousBook(quizResult, "Seeker") : null
  );

  useEffect(() => {
    if (!quizResult) {
      navigate("/luminous/quiz");
    }
  }, [navigate, quizResult]);

  useEffect(() => {
    if (!quizResult) return;
    const nextBook = resolveLuminousBook(quizResult, userName);
    setResolvedBook((current) => mergeResolvedBook(nextBook, current));
  }, [quizResult, userName]);

  const primaryOrder = useMemo(() => (quizResult ? orders[quizResult.finalOrder] : null), [quizResult]);
  const secondaryOrder = useMemo(
    () => (quizResult ? orders[quizResult.secondaryOrder] : null),
    [quizResult]
  );

  const handleBlockChange = (sectionId: string, blockId: string, value: string) => {
    if (!resolvedBook) return;
    setResolvedBook((current) => {
      if (!current) return current;
      const nextSections = current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const blocks = section.blocks.map((block) => {
          if (block.id !== blockId) return block;
          return { ...block, value, edited: true };
        });
        return { ...section, blocks };
      });
      return { ...current, sections: nextSections };
    });
  };

  const handleResetBlock = (sectionId: string, blockId: string) => {
    setResolvedBook((current) => {
      if (!current) return current;
      const nextSections = current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const blocks = section.blocks.map((block) => {
          if (block.id !== blockId) return block;
          return { ...block, value: block.defaultValue, edited: false };
        });
        return { ...section, blocks };
      });
      return { ...current, sections: nextSections };
    });
  };

  const handleContinue = () => {
    if (!quizResult || !resolvedBook) return;
    navigate("/luminous/checkout", {
      state: { quizResult, dob, resolvedBook, userName },
    });
  };

  if (!quizResult || !primaryOrder || !secondaryOrder || !resolvedBook) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Book builder</p>
            <h1 className="text-3xl font-semibold">Forge your legend book</h1>
            <p className="text-slate-300">
              Quiz complete. Refine your book before checkout.
            </p>
          </div>
          <Button variant="outline" className="border-slate-700 text-slate-100" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <Card className="lg:col-span-2 bg-slate-900/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">Your book</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Recipient name</Label>
                <Input
                  id="name"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100"
                  placeholder="Seeker"
                />
              </div>

              {resolvedBook.sections.map((section) => (
                <div key={section.id} className="space-y-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-slate-400">Section</p>
                      <h3 className="text-xl font-semibold text-slate-50">{section.title}</h3>
                      {section.description && (
                        <p className="text-sm text-slate-400">{section.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{section.blocks.length} block(s)</span>
                  </div>

                  <div className="space-y-4">
                    {section.blocks.map((block) => (
                      <div key={block.id} className="p-4 rounded-lg border border-slate-800 bg-slate-900/40 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm text-slate-300">{block.editable ? "Editable" : "Locked"}</div>
                          {block.editable && (
                            <Button size="sm" variant="ghost" onClick={() => handleResetBlock(section.id, block.id)}>
                              Reset
                            </Button>
                          )}
                        </div>
                        {block.editable ? (
                          <Textarea
                            value={block.value}
                            onChange={(event) => handleBlockChange(section.id, block.id, event.target.value)}
                            className="min-h-[140px] bg-slate-950 border-slate-800 text-slate-100"
                          />
                        ) : (
                          <p className="text-slate-200 whitespace-pre-line">{block.value}</p>
                        )}
                        {block.edited && <p className="text-xs text-emerald-400">Edited</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <Button size="lg" onClick={handleContinue}>
                  Continue to checkout
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">Legend snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-200">
              <div>
                <p className="text-sm text-slate-400">Primary Order</p>
                <p className="text-lg font-semibold">{primaryOrder.name}</p>
                <p className="text-sm text-slate-400">{primaryOrder.tagline}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Secondary Order</p>
                <p className="text-lg font-semibold">{secondaryOrder.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Scores</p>
                <p>Primary: {quizResult.scores[quizResult.finalOrder]}</p>
                <p>Secondary: {quizResult.scores[quizResult.secondaryOrder]}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Book title</p>
                <p className="font-semibold">{resolvedBook.title}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Includes</p>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  <li>Origin story & Order profile</li>
                  <li>Editable abilities, quests, allies, and forward path</li>
                  <li>PDF export in checkout</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LuminousBookBuilder;
