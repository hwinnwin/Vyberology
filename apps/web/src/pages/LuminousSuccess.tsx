import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { generateLegendBook } from "@/features/luminous/pdf";
import { QuizResult } from "@/features/luminous/types";

interface PendingOrder {
  quizResult: QuizResult;
  dob: string;
  name: string;
  email: string;
  dedication?: string;
}

const LuminousSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"loading" | "generating" | "ready" | "error">("loading");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<PendingOrder | null>(null);

  useEffect(() => {
    if (!sessionId) {
      navigate("/luminous");
      return;
    }

    // Retrieve the pending order from sessionStorage
    const storedOrder = sessionStorage.getItem("luminous_pending_order");
    if (!storedOrder) {
      // No pending order data - payment may have succeeded but we lost the quiz data
      setStatus("error");
      return;
    }

    try {
      const order: PendingOrder = JSON.parse(storedOrder);
      setOrderInfo(order);
      setStatus("generating");

      // Generate the PDF
      const pdfBlob = generateLegendBook(
        {
          name: order.name,
          email: order.email,
          dob: order.dob,
          dedication: order.dedication,
        },
        order.quizResult
      );

      const url = URL.createObjectURL(pdfBlob);
      setDownloadUrl(url);
      setStatus("ready");

      // Clear the pending order
      sessionStorage.removeItem("luminous_pending_order");
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      setStatus("error");
    }
  }, [sessionId, navigate]);

  if (status === "loading" || status === "generating") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-slate-300">
            {status === "loading" ? "Verifying payment..." : "Forging your legend book..."}
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Card className="bg-slate-900/70 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">Payment Received</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-200">
              <p>
                Your payment was successful, but we couldn't generate your PDF automatically.
                Don't worry - your order has been saved.
              </p>
              <p>
                Please contact us at <strong>support@vyberology.com</strong> with your email
                address and we'll send your Luminous Legend Book directly.
              </p>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="border-slate-700 text-slate-100" asChild>
                  <Link to="/luminous">Return to Luminous</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Card className="bg-slate-900/70 border-slate-800">
          <CardHeader>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Payment Successful</p>
              <CardTitle className="text-2xl text-slate-100">Your legend has been forged</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 text-slate-200">
            <p>
              Thank you, <strong>{orderInfo?.name}</strong>! Your <strong>{orderInfo?.quizResult.finalOrder}</strong> legend
              book is ready. Download it below to begin your journey.
            </p>

            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-slate-400">Order Details</p>
              <div className="flex justify-between">
                <span>Luminous Legend Book</span>
                <span>$33 AUD</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Order: {orderInfo?.quizResult.finalOrder}</span>
                <span>Lumenheart: {orderInfo?.quizResult.lumenheart}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {downloadUrl && (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  asChild
                >
                  <a href={downloadUrl} download={`luminous-legend-${orderInfo?.quizResult.finalOrder.toLowerCase()}.pdf`}>
                    Download Your Legend Book
                  </a>
                </Button>
              )}
              <Button variant="outline" className="border-slate-700 text-slate-100" asChild>
                <Link to="/luminous">Back to Luminous</Link>
              </Button>
            </div>

            <p className="text-sm text-slate-400">
              A copy has also been sent to <strong>{orderInfo?.email}</strong>.
              If you have any questions, contact support@vyberology.com.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LuminousSuccess;
