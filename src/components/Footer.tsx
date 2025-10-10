import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-lf-midnight/80 backdrop-blur">
      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-lf-aurora" />
              <span className="font-display text-xl font-bold text-white">Vyberology</span>
            </div>
            <p className="text-lf-slate text-sm">
              Decode Your Life's Frequency
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-display text-lg font-semibold text-white mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/numerology" className="text-lf-slate hover:text-lf-aurora transition-colors">
                  Numerology Reading
                </Link>
              </li>
              <li>
                <Link to="/compatibility" className="text-lf-slate hover:text-lf-aurora transition-colors">
                  Compatibility
                </Link>
              </li>
              <li>
                <Link to="/get-vybe" className="text-lf-slate hover:text-lf-aurora transition-colors">
                  Get Vybe
                </Link>
              </li>
              <li>
                <Link to="/brand" className="text-lf-slate hover:text-lf-aurora transition-colors">
                  Brand Kit
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display text-lg font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-lf-slate hover:text-lf-aurora transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-lf-slate hover:text-lf-aurora transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/hwinnwin/Vyberology"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lf-slate hover:text-lf-aurora transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-lf-slate">
          <p>
            &copy; {currentYear} Vyberology. All rights reserved. | For entertainment and educational purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
