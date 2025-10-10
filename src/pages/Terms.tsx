import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Mail, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lf-midnight via-lf-ink to-lf-midnight">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4 gap-2 text-lf-slate hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-lf-aurora" />
            <h1 className="font-display text-5xl font-bold text-white">
              Terms of Service
            </h1>
          </div>
          <p className="text-lf-slate text-lg">
            Last Updated: October 11, 2025
          </p>
        </div>

        {/* Content */}
        <Card className="border-white/10 bg-lf-ink/60 p-8 backdrop-blur">
          <div className="prose prose-invert max-w-none">

            {/* Important Notice */}
            <div className="bg-lf-violet/20 border border-lf-violet rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-lf-aurora flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-display text-xl font-bold text-white mb-2">Important Notice</h3>
                  <p className="text-lf-slate leading-relaxed">
                    Vyberology is provided for <strong className="text-white">entertainment and educational purposes only</strong>. Our numerology readings are NOT professional advice (medical, legal, financial, or psychological) and should NOT replace professional consultation with qualified experts.
                  </p>
                </div>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">1. Agreement to Terms</h2>
              <p className="text-lf-slate leading-relaxed">
                By accessing or using Vyberology ("Service," "we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these Terms, you do not have permission to access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">2. Description of Service</h2>
              <p className="text-lf-slate leading-relaxed mb-4">
                Vyberology is a numerology reading service that:
              </p>
              <ul className="list-disc list-inside text-lf-slate space-y-2">
                <li>Generates personalized numerology readings based on your name and date of birth</li>
                <li>Calculates Life Path, Expression, Soul Urge, and Personality numbers</li>
                <li>Provides AI-powered interpretations of numerological patterns</li>
                <li>Offers voice-activated assistance ("Hey Lumen") for number recognition</li>
                <li>Allows you to explore compatibility readings and pair readings</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">3. User Responsibilities</h2>

              <h3 className="font-display text-2xl font-semibold text-lf-aurora mb-3">Acceptable Use</h3>
              <p className="text-lf-slate leading-relaxed mb-4">You agree to:</p>
              <ul className="list-disc list-inside text-lf-slate space-y-2 mb-6">
                <li>Provide accurate information (name and date of birth)</li>
                <li>Use the Service lawfully and respectfully</li>
                <li>Not attempt to reverse engineer, hack, or exploit the Service</li>
                <li>Not use automated tools to scrape or abuse the Service</li>
                <li>Not impersonate others or provide false information</li>
              </ul>

              <h3 className="font-display text-2xl font-semibold text-lf-aurora mb-3">Prohibited Uses</h3>
              <p className="text-lf-slate leading-relaxed mb-4">You may NOT use Vyberology to:</p>
              <ul className="list-disc list-inside text-lf-slate space-y-2">
                <li>Make critical life decisions without professional consultation</li>
                <li>Diagnose, treat, or manage medical conditions</li>
                <li>Make financial or legal decisions</li>
                <li>Harass, harm, or discriminate against others</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">4. Intellectual Property Rights</h2>

              <h3 className="font-display text-2xl font-semibold text-lf-aurora mb-3">Our Content</h3>
              <p className="text-lf-slate leading-relaxed mb-4">
                All content, features, and functionality of Vyberology are owned by us and protected by copyright, trademark, and other intellectual property laws. This includes:
              </p>
              <ul className="list-disc list-inside text-lf-slate space-y-2 mb-6">
                <li>Numerology calculation algorithms</li>
                <li>AI-generated reading text</li>
                <li>Website design and code</li>
                <li>Branding and logos</li>
                <li>"Vyberology" name and trademark</li>
              </ul>

              <h3 className="font-display text-2xl font-semibold text-lf-aurora mb-3">Your Content</h3>
              <p className="text-lf-slate leading-relaxed">
                You retain ownership of information you provide (name, date of birth). You grant us a license to process this information to generate readings. Generated readings are for your personal use. You may share readings, but may not claim them as your original work.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">5. Privacy and Data Protection</h2>
              <p className="text-lf-slate leading-relaxed">
                Your privacy is important to us. Please review our <Link to="/privacy" className="text-lf-aurora hover:text-lf-violet transition-colors underline">Privacy Policy</Link> to understand what information we collect, how we use and protect your data, and your rights regarding your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">6. Limitation of Liability</h2>
              <p className="text-lf-slate leading-relaxed mb-4">
                To the maximum extent permitted by law, we shall NOT be liable for:
              </p>
              <ul className="list-disc list-inside text-lf-slate space-y-2 mb-6">
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or use</li>
                <li>Decisions made based on readings</li>
                <li>Service interruptions or errors</li>
                <li>Third-party service failures</li>
              </ul>

              <p className="text-lf-slate leading-relaxed">
                The Service is provided on an <strong className="text-white">"AS IS"</strong> and <strong className="text-white">"AS AVAILABLE"</strong> basis without warranties of any kind.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">7. Account Terms</h2>
              <p className="text-lf-slate leading-relaxed mb-4">If we offer account creation:</p>
              <ul className="list-disc list-inside text-lf-slate space-y-2">
                <li>You must be at least 13 years old to create an account</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must provide accurate and complete information</li>
                <li>We reserve the right to suspend or terminate accounts for Terms violations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">8. Modifications to Service and Terms</h2>
              <p className="text-lf-slate leading-relaxed mb-4">
                We reserve the right to modify or discontinue the Service at any time and may revise these Terms by updating this document. Your continued use after changes constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">9. Special Provisions</h2>

              <h3 className="font-display text-2xl font-semibold text-lf-aurora mb-3">For EU Users (GDPR Compliance)</h3>
              <ul className="list-disc list-inside text-lf-slate space-y-2 mb-6">
                <li>You have the right to withdraw consent at any time</li>
                <li>You have the right to lodge a complaint with a supervisory authority</li>
                <li>See our Privacy Policy for full GDPR rights</li>
              </ul>

              <h3 className="font-display text-2xl font-semibold text-lf-aurora mb-3">For California Users (CCPA Compliance)</h3>
              <ul className="list-disc list-inside text-lf-slate space-y-2 mb-6">
                <li>You have the right to know what personal information is collected</li>
                <li>We do not sell your personal information</li>
                <li>See our Privacy Policy for full CCPA rights</li>
              </ul>

              <h3 className="font-display text-2xl font-semibold text-lf-aurora mb-3">For Minors</h3>
              <ul className="list-disc list-inside text-lf-slate space-y-2">
                <li>Users under 13 are not permitted to use the Service</li>
                <li>Users aged 13-18 must have parental consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">10. Contact Information</h2>
              <p className="text-lf-slate leading-relaxed mb-4">
                For questions about these Terms:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-lf-aurora">
                  <Mail className="h-5 w-5" />
                  <a href="mailto:legal@hwinnwin.com" className="hover:text-lf-violet transition-colors">
                    legal@hwinnwin.com
                  </a>
                </div>
                <div className="flex items-center gap-2 text-lf-aurora">
                  <Mail className="h-5 w-5" />
                  <a href="https://github.com/hwinnwin/Vyberology" target="_blank" rel="noopener noreferrer" className="hover:text-lf-violet transition-colors">
                    GitHub: hwinnwin/Vyberology
                  </a>
                </div>
              </div>
            </section>

            <div className="border-t border-white/10 pt-6 mt-8">
              <p className="text-lf-slate text-center">
                By using Vyberology, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </Card>

        {/* Footer Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <Link to="/privacy">
            <Button variant="outline" className="border-lf-violet text-lf-violet hover:bg-lf-violet/10">
              View Privacy Policy
            </Button>
          </Link>
          <Link to="/">
            <Button className="bg-lf-gradient shadow-glow hover:shadow-glow-lg">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Terms;
