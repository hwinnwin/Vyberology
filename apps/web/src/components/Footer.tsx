import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/lib/i18n";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { user, credits, signOut } = useAuth();
  const { t, i18n } = useTranslation();

  return (
    <footer className="bg-vy-charcoal text-vy-parchment/70">
      <div className="vy-divider" />

      <div className="max-w-[800px] mx-auto px-6 py-16">
        {/* Brand */}
        <div className="text-center mb-12">
          <h3 className="font-display text-2xl text-vy-parchment tracking-[0.04em] mb-2">
            {t("brand")}
          </h3>
          <p className="font-sans text-xs font-medium uppercase tracking-[0.12em] text-vy-gold-muted">
            {t("tagline")}
          </p>
        </div>

        {/* Account */}
        <div className="flex justify-center mb-8">
          {user ? (
            <div className="flex items-center gap-4 px-5 py-3 rounded-xl border border-vy-parchment/10 bg-vy-parchment/[0.04]">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-vy-gold" />
                <span className="font-sans text-sm text-vy-parchment/80">
                  {user.email ?? t("auth.signedIn")}
                </span>
              </div>
              <span className="font-sans text-xs text-vy-gold font-medium">
                {t("footer.credits", { count: credits })}
              </span>
              <button
                onClick={() => void signOut()}
                className="flex items-center gap-1.5 font-sans text-xs text-vy-parchment/40 hover:text-vy-parchment/70 transition-colors duration-200 bg-transparent border-none cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t("auth.signOut")}
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="px-5 py-2.5 rounded-xl border border-vy-gold/30 font-sans text-sm font-medium text-vy-gold hover:bg-vy-gold/10 transition-all duration-200 no-underline"
            >
              {t("auth.signIn")}
            </Link>
          )}
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-12 text-sm font-sans">
          <Link to="/compatibility" className="hover:text-vy-gold transition-colors duration-200">
            {t("nav.compatibility")}
          </Link>
          <Link to="/lyf-path" className="hover:text-vy-gold transition-colors duration-200">
            {t("nav.lyfPath")}
          </Link>
          <Link to="/history" className="hover:text-vy-gold transition-colors duration-200">
            {t("nav.history")}
          </Link>
          <Link to="/pricing" className="hover:text-vy-gold transition-colors duration-200">
            {t("nav.premium")}
          </Link>
        </div>

        {/* Divider */}
        <div className="h-px bg-vy-parchment/10 mb-8" />

        {/* Language toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-vy-parchment/10 bg-vy-parchment/[0.04]">
            <Globe className="w-3.5 h-3.5 text-vy-parchment/40" />
            {LANGUAGES.map((lang, idx) => (
              <span key={lang.code} className="flex items-center gap-2">
                {idx > 0 && <span className="text-vy-parchment/20">|</span>}
                <button
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`font-sans text-xs transition-colors duration-200 bg-transparent border-none cursor-pointer px-1 py-0.5 rounded ${
                    i18n.language === lang.code || i18n.language.startsWith(lang.code + "-")
                      ? "text-vy-gold font-medium"
                      : "text-vy-parchment/40 hover:text-vy-parchment/70"
                  }`}
                >
                  {lang.label}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Legal row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-vy-parchment/40">
          <p>{t("footer.copyright", { year: currentYear })}</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-vy-parchment/70 transition-colors duration-200">
              {t("nav.privacy")}
            </Link>
            <Link to="/terms" className="hover:text-vy-parchment/70 transition-colors duration-200">
              {t("nav.terms")}
            </Link>
            <Link to="/settings" className="hover:text-vy-parchment/70 transition-colors duration-200">
              {t("nav.settings")}
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-vy-parchment/25 mt-6">
          {t("footer.disclaimer")}
        </p>
      </div>
    </footer>
  );
}
