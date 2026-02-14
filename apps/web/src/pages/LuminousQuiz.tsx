import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { orders, quizQuestions } from "@/features/luminous/data";
import { scoreQuiz } from "@/features/luminous/quiz";
import { QuizResult } from "@/features/luminous/types";
import { format, parseISO } from "date-fns";

const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), "PPP");
  } catch (error) {
    return dateString;
  }
};

const LuminousQuiz = () => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [dob, setDob] = useState("");
  const [result, setResult] = useState<QuizResult | null>(null);
  const navigate = useNavigate();

  const allAnswered = useMemo(
    () => quizQuestions.every((question) => Boolean(answers[question.id])),
    [answers]
  );

  const handleSubmit = () => {
    if (!dob || !allAnswered) return;
    const orderedAnswers = quizQuestions.map((question) => answers[question.id]);
    const scored = scoreQuiz(orderedAnswers, dob);
    setResult(scored);
  };

  const goToBuilder = () => {
    if (!result) return;
    navigate("/luminous/book", { state: { quizResult: result, dob } });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Luminous Legends</p>
            <h1 className="text-3xl font-semibold">12-question mythic identity quiz</h1>
            <p className="text-slate-300">Answer honestly; there are no wrong choices.</p>
          </div>
          <Button variant="outline" className="border-slate-700 text-slate-100" onClick={() => navigate("/luminous")}>Back</Button>
        </div>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Your birth date</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              onChange={(event) => setDob(event.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100"
            />
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {quizQuestions.map((question) => (
            <Card key={question.id} className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">{question.id}. {question.prompt}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  onValueChange={(value) =>
                    setAnswers((current) => ({ ...current, [question.id]: value }))
                  }
                  value={answers[question.id]}
                  className="grid md:grid-cols-2 gap-3"
                >
                  {question.answers.map((answer) => (
                    <Label
                      key={answer.label}
                      htmlFor={`q-${question.id}-${answer.label}`}
                      className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-sky-400 transition"
                    >
                      <RadioGroupItem
                        value={answer.label}
                        id={`q-${question.id}-${answer.label}`}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-slate-100">{answer.label}. {answer.text}</p>
                        <p className="text-xs text-slate-400">Order: {answer.order}</p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4">
          <Button size="lg" disabled={!allAnswered || !dob} onClick={handleSubmit}>
            Reveal my Order
          </Button>
          <Button size="lg" variant="outline" className="border-slate-700 text-slate-100" onClick={() => setResult(null)}>
            Reset
          </Button>
        </div>

        {result && (
          <Card className="bg-slate-900/70 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">Your Order of Light</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-200">
              <p className="text-lg font-semibold">{result.finalOrder}</p>
              <p>Lumenheart: {result.lumenheart}</p>
              <p>Life Path: {result.lifePath} ({formatDate(dob)})</p>
              <div className="grid md:grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="font-semibold mb-1">Light traits</p>
                  <ul className="list-disc list-inside text-slate-300">
                    {orders[result.finalOrder].lightTraits.map((trait) => (
                      <li key={trait}>{trait}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Veil traits</p>
                  <ul className="list-disc list-inside text-slate-300">
                    {orders[result.finalOrder].veilTraits.map((trait) => (
                      <li key={trait}>{trait}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="pt-2">
                <Button size="lg" onClick={goToBuilder}>Build my Legend Book</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LuminousQuiz;
