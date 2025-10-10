import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
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
            <Shield className="h-8 w-8 text-lf-aurora" />
            <h1 className="font-display text-5xl font-bold text-white">
              Privacy Policy
            </h1>
          </div>
          <p className="text-lf-slate text-lg">
            Last Updated: October 11, 2025
          </p>
        </div>

        {/* Content */}
        <Card className="border-white/10 bg-lf-ink/60 p-8 backdrop-blur">
          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">Introduction</h2>
              <p className="text-lf-slate leading-relaxed">
                Welcome to Vyberology ("we," "our," or "us"). We are committed to protecting your privacy and ensuring transparency about how we collect, use, and safeguard your information. This Privacy Policy explains our practices regarding data collection and use when you use our numerology reading service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">Information We Collect</h2>

              <h3 className="font-display text-2xl font-semibold text-lf-aurora mb-3">Information You Provide Directly</h3>
              <p className="text-lf-slate leading-relaxed mb-4">
                When you use Vyberology to generate numerology readings, you may provide:
              </p>
              <ul className="list-disc list-inside text-lf-slate space-y-2 mb-6">
                <li><strong className="text-white">Personal Information:</strong> Full name and date of birth</li>
                <li><strong className="text-white">Reading Inputs:</strong> Any numbers or text you enter for numerology analysis</li>
                <li><strong className="text-white">Screenshots:</strong> If you use our "Hey Lumen" voice assistant feature, you may capture screenshots containing numbers or text</li>
              </ul>

              <h3 className="font-display text-2xl font-semibold text-lf-aurora mb-3">Information Collected Automatically</h3>
              <ul className="list-disc list-inside text-lf-slate space-y-2 mb-6">
                <li><strong className="text-white">Authentication Data:</strong> If you create an account, we store authentication tokens in your browser's localStorage</li>
                <li><strong className="text-white">Usage Data:</strong> Basic usage patterns to improve our service</li>
                <li><strong className="text-white">Technical Data:</strong> Browser type, device information, IP address</li>
              </ul>

              <h3 className="font-display text-2xl font-semibold text-lf-aurora mb-3">Information We Do NOT Collect</h3>
              <ul className="list-disc list-inside text-lf-slate space-y-2">
                <li>We do not use cookies for tracking</li>
                <li>We do not share your data with third-party advertisers</li>
                <li>We do not sell your personal information</li>
                <li>We do not store payment information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">How We Use Your Information</h2>
              <p className="text-lf-slate leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ol className="list-decimal list-inside text-lf-slate space-y-2">
                <li><strong className="text-white">Generate Readings:</strong> Process your name, date of birth, and numbers through our AI-powered numerology engine</li>
                <li><strong className="text-white">Improve Service:</strong> Analyze usage patterns to enhance features and fix bugs</li>
                <li><strong className="text-white">Authentication:</strong> Maintain your session if you create an account</li>
                <li><strong className="text-white">Communication:</strong> Respond to your inquiries and provide customer support</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">Third-Party Services</h2>
              <p className="text-lf-slate leading-relaxed mb-4">
                We use the following trusted third-party services:
              </p>
              <ul className="list-disc list-inside text-lf-slate space-y-2">
                <li><strong className="text-white">Supabase:</strong> Backend infrastructure and database hosting</li>
                <li><strong className="text-white">OpenAI:</strong> AI-powered reading generation (name and birth date are sent to OpenAI's API for processing)</li>
                <li><strong className="text-white">Lovable.dev:</strong> Deployment and hosting platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">Data Security</h2>
              <p className="text-lf-slate leading-relaxed">
                We implement industry-standard security measures:
              </p>
              <ul className="list-disc list-inside text-lf-slate space-y-2 mt-4">
                <li>API keys are stored securely as server-side secrets</li>
                <li>All data transmission uses HTTPS encryption</li>
                <li>Authentication tokens are stored locally and never transmitted insecurely</li>
                <li>Edge Functions process sensitive data server-side</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">Your Rights</h2>

              <h3 className="font-display text-2xl font-semibold text-lf-aurora mb-3">For All Users</h3>
              <ul className="list-disc list-inside text-lf-slate space-y-2 mb-6">
                <li><strong className="text-white">Access:</strong> Request a copy of your data</li>
                <li><strong className="text-white">Correction:</strong> Update inaccurate information</li>
                <li><strong className="text-white">Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong className="text-white">Opt-Out:</strong> Stop using the service at any time</li>
              </ul>

              <h3 className="font-display text-2xl font-semibold text-lf-aurora mb-3">For EU Users (GDPR)</h3>
              <ul className="list-disc list-inside text-lf-slate space-y-2 mb-6">
                <li><strong className="text-white">Right to be Forgotten:</strong> Complete deletion of your data</li>
                <li><strong className="text-white">Data Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong className="text-white">Restriction of Processing:</strong> Limit how we use your data</li>
                <li><strong className="text-white">Object to Processing:</strong> Object to certain types of data processing</li>
              </ul>

              <h3 className="font-display text-2xl font-semibold text-lf-aurora mb-3">For California Users (CCPA)</h3>
              <ul className="list-disc list-inside text-lf-slate space-y-2">
                <li><strong className="text-white">Know:</strong> What personal information is collected</li>
                <li><strong className="text-white">Delete:</strong> Request deletion of personal information</li>
                <li><strong className="text-white">Opt-Out:</strong> Opt-out of sale of personal information (Note: We do not sell personal information)</li>
                <li><strong className="text-white">Non-Discrimination:</strong> Equal service regardless of privacy choices</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">Children's Privacy</h2>
              <p className="text-lf-slate leading-relaxed">
                Vyberology is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">Changes to This Privacy Policy</h2>
              <p className="text-lf-slate leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by updating the "Last Updated" date at the top of this policy and displaying a notice on our website/app.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-4">Contact Us</h2>
              <p className="text-lf-slate leading-relaxed mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or your data:
              </p>
              <div className="flex items-center gap-2 text-lf-aurora">
                <Mail className="h-5 w-5" />
                <a href="https://github.com/hwinnwin/Vyberology" className="hover:text-lf-violet transition-colors">
                  GitHub: hwinnwin/Vyberology
                </a>
              </div>
              <p className="text-lf-slate text-sm mt-4">
                For GDPR-related inquiries, please specify "GDPR Request" in your subject line.
              </p>
            </section>
          </div>
        </Card>

        {/* Footer Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <Link to="/terms">
            <Button variant="outline" className="border-lf-violet text-lf-violet hover:bg-lf-violet/10">
              View Terms of Service
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

export default Privacy;
