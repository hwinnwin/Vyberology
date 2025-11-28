import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ThankYouState {
  downloadUrl?: string;
  order?: string;
  email?: string;
}

const LuminousThankYou = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { downloadUrl, order, email } = (location.state as ThankYouState) || {};

  useEffect(() => {
    if (!downloadUrl) {
      navigate("/luminous");
    }
  }, [downloadUrl, navigate]);

  if (!downloadUrl) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Card className="bg-slate-900/70 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Your legend is ready</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-200">
            <p>
              Thank you! {order ? `${order} legend book` : "Your legend book"} has been forged. Download below or
              check your inbox at {email ?? "the email provided"}.
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <a href={downloadUrl} download="luminous-legend.pdf">
                  Download PDF
                </a>
              </Button>
              <Button variant="outline" className="border-slate-700 text-slate-100" asChild>
                <Link to="/luminous">Back to start</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LuminousThankYou;
