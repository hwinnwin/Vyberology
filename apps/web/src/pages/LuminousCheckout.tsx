import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { orders, storyBlocks } from "@/features/luminous/data";
import { QuizResult } from "@/features/luminous/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CheckoutState {
  quizResult?: QuizResult;
  dob?: string;
}

const PRICE_AUD = 33;

const LuminousCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const state = (location.state as CheckoutState) || {};
  const [quizResult] = useState<QuizResult | null>(state.quizResult ?? null);
  const [dob] = useState(state.dob ?? "");
  const [form, setForm] = useState({ name: "", email: "", dedication: "" });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!quizResult) {
      navigate("/luminous/quiz");
    }
  }, [navigate, quizResult]);

  const orderSummary = useMemo(() => {
    if (!quizResult) return null;
    const order = orders[quizResult.finalOrder];
    return {
      order,
      opening: storyBlocks.openings["Book of Light"],
      closing: storyBlocks.closings["Book of Light"],
    };
  }, [quizResult]);

  const handleChange = (key: "name" | "email" | "dedication", value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleCheckout = async () => {
    if (!quizResult || !form.name || !form.email || !dob) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          email: form.email,
          name: form.name,
          orderOfLight: quizResult.finalOrder,
          dob,
          dedication: form.dedication,
          quizResult,
        },
      });

      if (error) {
        console.error("Checkout error:", error);
        toast({
          title: "Checkout failed",
          description: "Unable to start checkout. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        // Store quiz data in sessionStorage for success page
        sessionStorage.setItem(
          "luminous_pending_order",
          JSON.stringify({
            quizResult,
            dob,
            name: form.name,
            email: form.email,
            dedication: form.dedication,
          })
        );
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        toast({
          title: "Checkout failed",
          description: "No checkout URL received. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast({
        title: "Checkout failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!quizResult || !orderSummary) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Checkout</p>
            <h1 className="text-3xl font-semibold">Forge your legend book</h1>
            <p className="text-slate-300">Complete your purchase to receive your personalised PDF.</p>
          </div>
          <Button variant="outline" className="border-slate-700 text-slate-100" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          <Card className="md:col-span-2 bg-slate-900/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">Your details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100"
                  placeholder="Your name as it will appear in the book"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100"
                  placeholder="We'll send your PDF here"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dedication">Dedication (optional)</Label>
                <Textarea
                  id="dedication"
                  value={form.dedication}
                  onChange={(event) => handleChange("dedication", event.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100"
                  placeholder="A personal note to include in your legend book"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div className="text-slate-400 text-sm">
                Secure checkout powered by Stripe
              </div>
              <Button
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing || !form.name || !form.email}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                {isProcessing ? "Redirecting..." : `Pay $${PRICE_AUD} AUD`}
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">Luminous Legend Book</p>
                  <p className="text-sm text-slate-400">{orderSummary.order.name} Order</p>
                </div>
                <p className="font-semibold">${PRICE_AUD}</p>
              </div>
              <hr className="border-slate-700" />
              <div>
                <p className="font-semibold mb-2">Includes</p>
                <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
                  <li>Your mythic origin story</li>
                  <li>The trial you must face</li>
                  <li>Your luminous destiny</li>
                  <li>Signature ability spotlight</li>
                  <li>Light and veil trait analysis</li>
                  <li>Personalised Lumenheart crystal</li>
                  <li>Printable PDF format</li>
                </ul>
              </div>
              <hr className="border-slate-700" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${PRICE_AUD} AUD</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LuminousCheckout;
