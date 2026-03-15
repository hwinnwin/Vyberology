import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Home, XCircle } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-vy-parchment grain">
      {/* Nav */}
      <nav className="max-w-[720px] mx-auto w-full flex justify-between items-center px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-sans text-sm font-medium text-vy-charcoal/50 hover:text-vy-charcoal transition-colors duration-200 bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <Link
          to="/"
          className="flex items-center gap-2 font-sans text-sm font-medium text-vy-charcoal/50 hover:text-vy-charcoal transition-colors duration-200 no-underline"
        >
          <Home size={16} /> Home
        </Link>
      </nav>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-[520px] w-full text-center">
          {/* Cancel Icon */}
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-vy-charcoal/[0.06] flex items-center justify-center">
            <XCircle className="w-8 h-8 text-vy-charcoal/40" />
          </div>

          <p className="vy-label text-vy-charcoal/40 mb-3">Cancelled</p>
          <h1 className="vy-display text-[clamp(28px,6vw,36px)] text-vy-charcoal mb-3">
            Payment Cancelled
          </h1>
          <div className="vy-divider max-w-[80px] mx-auto mb-4" />
          <p className="font-sans text-base font-light text-vy-charcoal/50 mb-8">
            No charges were made to your account.
          </p>

          {/* Info Card */}
          <div className="p-6 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm mb-8 text-left">
            <h3 className="font-display text-lg font-semibold text-vy-charcoal mb-3">
              What happened?
            </h3>
            <p className="font-sans text-sm text-vy-charcoal/50 mb-4 leading-relaxed">
              The checkout was cancelled before any payment was processed. This is completely normal — you can return to the premium page anytime to try again.
            </p>
            <p className="font-sans text-sm text-vy-charcoal/50 leading-relaxed">
              If you experienced any issues during checkout, please don't hesitate to reach out.
            </p>
          </div>

          {/* FAQ */}
          <div className="p-6 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50 backdrop-blur-sm mb-8 text-left">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-vy-charcoal/50 mb-4">
              Common Questions
            </h3>
            <div className="space-y-3">
              <div>
                <p className="font-sans text-sm font-medium text-vy-charcoal mb-0.5">
                  Will I be charged?
                </p>
                <p className="font-sans text-xs text-vy-charcoal/40">
                  No. Your payment was cancelled before processing.
                </p>
              </div>
              <div className="h-px bg-vy-charcoal/[0.06]" />
              <div>
                <p className="font-sans text-sm font-medium text-vy-charcoal mb-0.5">
                  Can I use a different payment method?
                </p>
                <p className="font-sans text-xs text-vy-charcoal/40">
                  Yes — we accept all major cards and payment methods through Stripe.
                </p>
              </div>
              <div className="h-px bg-vy-charcoal/[0.06]" />
              <div>
                <p className="font-sans text-sm font-medium text-vy-charcoal mb-0.5">
                  Is my information secure?
                </p>
                <p className="font-sans text-xs text-vy-charcoal/40">
                  All payments are processed securely through Stripe. We never store payment details.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/pricing")}
              className="flex-1 py-3 rounded-xl font-sans text-sm font-medium bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 transition-all duration-200 cursor-pointer border-none"
            >
              Back to Premium
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 py-3 rounded-xl font-sans text-sm font-medium bg-vy-charcoal/[0.06] text-vy-charcoal hover:bg-vy-charcoal/[0.12] transition-all duration-200 cursor-pointer border-none"
            >
              Return to Home
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
