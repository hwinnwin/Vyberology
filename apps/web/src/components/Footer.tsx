import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { user, credits, signOut } = useAuth();

  return (
    <footer className="bg-vy-charcoal text-vy-parchment/70">
      <div className="vy-divider" />

      <div className="max-w-[800px] mx-auto px-6 py-16">
        {/* Brand */}
        <div className="text-center mb-12">
          <h3 className="font-display text-2xl text-vy-parchment tracking-[0.04em] mb-2">
            Vyberology
          </h3>
          <p className="font-sans text-xs font-medium uppercase tracking-[0.12em] text-vy-gold-muted">
            Decode your life's frequency
          </p>
        </div>

        {/* Account */}
        <div className="flex justify-center mb-8">
          {user ? (
            <div className="flex items-center gap-4 px-5 py-3 rounded-xl border border-vy-parchment/10 bg-vy-parchment/[0.04]">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-vy-gold" />
                <span className="font-sans text-sm text-vy-parchment/80">
                  {user.email ?? "Signed in"}
                </span>
              </div>
              <span className="font-sans text-xs text-vy-gold font-medium">
                {credits} credit{credits !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => void signOut()}
                className="flex items-center gap-1.5 font-sans text-xs text-vy-parchment/40 hover:text-vy-parchment/70 transition-colors duration-200 bg-transparent border-none cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="px-5 py-2.5 rounded-xl border border-vy-gold/30 font-sans text-sm font-medium text-vy-gold hover:bg-vy-gold/10 transition-all duration-200 no-underline"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-12 text-sm font-sans">
          <Link to="/compatibility" className="hover:text-vy-gold transition-colors duration-200">
            Compatibility
          </Link>
          <Link to="/lyf-path" className="hover:text-vy-gold transition-colors duration-200">
            Lyf Path
          </Link>
          <Link to="/history" className="hover:text-vy-gold transition-colors duration-200">
            History
          </Link>
          <Link to="/pricing" className="hover:text-vy-gold transition-colors duration-200">
            Premium
          </Link>
        </div>

        {/* Divider */}
        <div className="h-px bg-vy-parchment/10 mb-8" />

        {/* Legal row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-vy-parchment/40">
          <p>&copy; {currentYear} Vyberology. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-vy-parchment/70 transition-colors duration-200">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-vy-parchment/70 transition-colors duration-200">
              Terms
            </Link>
            <Link to="/settings" className="hover:text-vy-parchment/70 transition-colors duration-200">
              Settings
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-vy-parchment/25 mt-6">
          For entertainment and educational purposes only.
        </p>
      </div>
    </footer>
  );
}
