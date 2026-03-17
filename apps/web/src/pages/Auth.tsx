import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Home, Mail, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";

type AuthMode = "signin" | "signup" | "magic-link";

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already signed in, redirect to home
  useEffect(() => {
    if (user) {
      navigate("/vybe", { replace: true });
    }
  }, [user, navigate]);

  const handleOAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/vybe`,
      },
    });

    if (error) {
      toast({
        title: t("auth.signInFailed"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      toast({
        title: t("auth.checkEmail"),
        description: t("auth.magicLinkSent"),
      });
    } catch (error) {
      toast({
        title: t("auth.magicLinkFailed"),
        description: error instanceof Error ? error.message : t("auth.somethingWrong"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: t("auth.checkEmail"),
          description: t("auth.confirmationSent"),
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      toast({
        title: mode === "signup" ? t("auth.signUpFailed") : t("auth.signInFailed"),
        description: error instanceof Error ? error.message : t("auth.somethingWrong"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-vy-parchment grain">
      {/* Nav */}
      <nav className="max-w-[720px] mx-auto w-full flex justify-end items-center px-6 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-sans text-sm font-medium text-vy-charcoal/50 hover:text-vy-charcoal transition-colors duration-200 no-underline"
        >
          <Home size={16} /> {t("nav.home")}
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-grow flex items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl font-semibold text-vy-charcoal tracking-[0.02em] mb-3">
              {t("brand")}
            </h1>
            <div className="vy-divider max-w-[60px] mx-auto mb-4" />
            <p className="font-sans text-sm text-vy-charcoal/50">
              {mode === "magic-link"
                ? t("auth.magicLinkSubtitle")
                : mode === "signin"
                  ? t("auth.signinSubtitle")
                  : t("auth.signupSubtitle")}
            </p>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleOAuth}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border border-vy-charcoal/[0.12] bg-white/60 hover:bg-white/80 hover:border-vy-charcoal/20 transition-all duration-200 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="font-sans text-sm font-medium text-vy-charcoal">
              {t("auth.continueWithGoogle")}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-vy-charcoal/[0.08]" />
            <span className="font-sans text-xs text-vy-charcoal/30 uppercase tracking-[0.1em]">
              {t("auth.or")}
            </span>
            <div className="flex-1 h-px bg-vy-charcoal/[0.08]" />
          </div>

          {/* Magic Link */}
          {mode === "magic-link" ? (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vy-charcoal/30" />
                <input
                  type="email"
                  placeholder={t("auth.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-vy-charcoal/[0.12] bg-white/60 font-sans text-sm text-vy-charcoal placeholder:text-vy-charcoal/30 focus:outline-none focus:border-vy-gold/40 focus:ring-1 focus:ring-vy-gold/20 transition-all duration-200"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-sans text-sm font-medium bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 transition-all duration-200 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t("auth.sending") : (
                  <>
                    {t("auth.sendMagicLink")}
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="w-full font-sans text-xs text-vy-charcoal/40 hover:text-vy-charcoal/60 bg-transparent border-none cursor-pointer p-0 transition-colors"
              >
                {t("auth.usePassword")}
              </button>
            </form>
          ) : (
            <>
              {/* Email + Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vy-charcoal/30" />
                  <input
                    type="email"
                    placeholder={t("auth.email")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-vy-charcoal/[0.12] bg-white/60 font-sans text-sm text-vy-charcoal placeholder:text-vy-charcoal/30 focus:outline-none focus:border-vy-gold/40 focus:ring-1 focus:ring-vy-gold/20 transition-all duration-200"
                  />
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 text-vy-charcoal/30 hover:text-vy-charcoal/50 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-4 pr-11 py-3.5 rounded-xl border border-vy-charcoal/[0.12] bg-white/60 font-sans text-sm text-vy-charcoal placeholder:text-vy-charcoal/30 focus:outline-none focus:border-vy-gold/40 focus:ring-1 focus:ring-vy-gold/20 transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-sans text-sm font-medium bg-vy-charcoal text-vy-parchment hover:bg-vy-charcoal/90 transition-all duration-200 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t("auth.processing") : (
                    <>
                      {mode === "signin" ? t("auth.signIn") : t("auth.createAccount")}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Magic link shortcut */}
              <button
                onClick={() => setMode("magic-link")}
                className="w-full flex items-center justify-center gap-2 mt-3 py-3 rounded-xl font-sans text-xs font-medium text-vy-charcoal/50 hover:text-vy-charcoal/70 bg-transparent border border-vy-charcoal/[0.06] hover:border-vy-charcoal/[0.12] cursor-pointer transition-all duration-200"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t("auth.magicLinkInstead")}
              </button>
            </>
          )}

          {/* Toggle mode */}
          {mode !== "magic-link" && (
            <p className="font-sans text-sm text-vy-charcoal/40 text-center mt-6">
              {mode === "signin" ? (
                <>
                  {t("auth.noAccount")}{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-vy-gold hover:text-vy-gold/80 font-medium bg-transparent border-none cursor-pointer p-0 underline transition-colors"
                  >
                    {t("auth.signUp")}
                  </button>
                </>
              ) : (
                <>
                  {t("auth.hasAccount")}{" "}
                  <button
                    onClick={() => setMode("signin")}
                    className="text-vy-gold hover:text-vy-gold/80 font-medium bg-transparent border-none cursor-pointer p-0 underline transition-colors"
                  >
                    {t("auth.signIn")}
                  </button>
                </>
              )}
            </p>
          )}

          {/* Terms note */}
          <p className="font-sans text-[11px] text-vy-charcoal/30 text-center mt-6 leading-relaxed">
            {t("auth.termsNotice")}{" "}
            <Link to="/terms" className="underline hover:text-vy-charcoal/50">
              {t("nav.terms")}
            </Link>{" "}
            {t("auth.and")}{" "}
            <Link to="/privacy" className="underline hover:text-vy-charcoal/50">
              {t("nav.privacy")}
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
