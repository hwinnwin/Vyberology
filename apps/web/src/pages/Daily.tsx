import React from 'react';
import { motion } from 'framer-motion';

// ============================================
// VYBEROLOGY DAILY READING PAGE
// Route: /daily
// ============================================

const STRIPE_PAYMENT_LINKS = {
  single: 'https://buy.stripe.com/YOUR_SINGLE_LINK', // Replace with your actual link
  threePack: 'https://buy.stripe.com/YOUR_3DAY_LINK',
  weekly: 'https://buy.stripe.com/YOUR_WEEKLY_LINK',
};

// Today's date formatted
const today = new Date();
const dateString = today.toLocaleDateString('en-AU', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

// Check if it's 1.11 (January 11)
const isPortalDay = today.getMonth() === 0 && today.getDate() === 11;

export default function Daily() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          {isPortalDay && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
          )}
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-20">
          {/* Portal Badge */}
          {isPortalDay && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mb-8"
            >
              <span className="px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-sm font-medium">
                ✨ 1.11 PORTAL DAY — Special Energy Active
              </span>
            </motion.div>
          )}

          {/* Date */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-purple-300/60 text-sm uppercase tracking-widest mb-4"
          >
            {dateString}
          </motion.p>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-center text-white mb-6"
          >
            {isPortalDay ? (
              <>The Portal of <span className="text-amber-400">Initiation</span></>
            ) : (
              <>Today's <span className="text-purple-400">Global Reading</span></>
            )}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-center text-slate-300 max-w-2xl mx-auto"
          >
            {isPortalDay
              ? '111 is an alignment signal. Your thoughts are manifesting rapidly. What you focus on NOW is what you\'re building.'
              : 'Understand the collective energy of the day. Then discover how it affects YOU.'}
          </motion.p>
        </div>
      </section>

      {/* Global Reading Content */}
      <section className="max-w-3xl mx-auto px-6 pb-12">
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 md:p-12">

          {/* Energy Signature */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Element', value: 'Fire 🔥', sub: 'Initiation' },
              { label: 'Chakra', value: 'Crown + Solar', sub: 'Vision → Action' },
              { label: 'Frequency', value: '111 Hz', sub: 'SOURCE HURTZ' },
              { label: 'Direction', value: 'Forward', sub: 'No looking back' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="text-center p-4 bg-slate-800/50 rounded-xl"
              >
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-lg font-semibold text-white">{item.value}</p>
                <p className="text-xs text-purple-400">{item.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Main Reading */}
          <div className="space-y-8 text-slate-300 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">🔮 Today's Collective Theme</h2>
              <p className="text-lg">
                {isPortalDay ? (
                  <>
                    1.11 asks one question: <span className="text-purple-400 font-semibold">"What are you ready to begin?"</span>
                  </>
                ) : (
                  'The energy today invites you to pause and align before action.'
                )}
              </p>
              <p className="mt-4">
                Not "what should you do" — what are you <em>READY</em> for? There's a difference between knowing the path and walking it. Today is for walkers.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">🌊 Collective Flow</h2>
              <div className="space-y-3">
                <p><span className="text-amber-400 font-medium">Morning:</span> High clarity. Ideas arrive fully formed. Don't second-guess the downloads.</p>
                <p><span className="text-orange-400 font-medium">Afternoon:</span> Fire meets friction. Some resistance is natural — it shows where old patterns still live.</p>
                <p><span className="text-purple-400 font-medium">Evening:</span> Integration. What you initiated today begins to settle into form.</p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">⚠️ Watch For</h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-red-400">•</span>
                  <span><strong>Overthinking</strong> — 111 rewards action, not analysis paralysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400">•</span>
                  <span><strong>Waiting for permission</strong> — the portal IS the permission</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400">•</span>
                  <span><strong>Playing small</strong> — this energy amplifies. If you shrink, it amplifies that too</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">🎁 The Gift</h2>
              <p>If you align with today's energy:</p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Rapid manifestation of intentions set today</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Clarity on your next chapter</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Synchronicities that confirm your direction</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span>A feeling of "finally" — like something has unlocked</span>
                </li>
              </ul>
            </div>

            {/* Collective Message */}
            <blockquote className="border-l-4 border-purple-500 pl-6 py-4 bg-purple-500/5 rounded-r-xl">
              <p className="text-xl italic text-white">
                "The door is open. It won't stay open forever. But it's open now. What you carry through it becomes your foundation for what's next."
              </p>
            </blockquote>
          </div>
        </div>
      </section>

      {/* CTA Section - The Money Maker */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-purple-900/40 to-violet-900/40 border border-purple-500/30 rounded-3xl p-8 md:p-12 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Want Clarity On How This Affects <span className="text-purple-400">YOU</span>?
          </h2>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            This is the <strong>global reading</strong> — what the day holds for everyone.
            But your personal numbers, your current phase, your unique frequency... that changes everything.
          </p>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Single Reading */}
            <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all">
              <h3 className="text-lg font-semibold text-white mb-2">Clarity Reading</h3>
              <p className="text-4xl font-bold text-white mb-1">$19</p>
              <p className="text-sm text-slate-400 mb-4">Today's energy, for you</p>
              <a
                href={STRIPE_PAYMENT_LINKS.single}
                className="block w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
              >
                Get Reading
              </a>
            </div>

            {/* 3-Day Pack - Featured */}
            <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-6 border-2 border-purple-500 relative hover:border-purple-400 transition-all transform md:-translate-y-2">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </span>
              <h3 className="text-lg font-semibold text-white mb-2">3-Day Pack</h3>
              <p className="text-4xl font-bold text-white mb-1">$49</p>
              <p className="text-sm text-slate-400 mb-4">Track the portal over 72 hours</p>
              <a
                href={STRIPE_PAYMENT_LINKS.threePack}
                className="block w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
              >
                Get 3-Day Pack
              </a>
            </div>

            {/* Weekly */}
            <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all">
              <h3 className="text-lg font-semibold text-white mb-2">Weekly Integration</h3>
              <p className="text-4xl font-bold text-white mb-1">$79</p>
              <p className="text-sm text-slate-400 mb-4">Full week navigation</p>
              <a
                href={STRIPE_PAYMENT_LINKS.weekly}
                className="block w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
              >
                Get Weekly
              </a>
            </div>
          </div>

          {/* Trust Line */}
          <p className="text-slate-500 text-sm">
            Confusion is normal. Clarity is optional. But you don't have to stay confused.
          </p>
        </motion.div>
      </section>

      {/* What You Get Section */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h3 className="text-2xl font-bold text-white text-center mb-8">
          What's In Your Clarity Reading
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: '🎯', title: 'Personal Context', desc: 'How today\'s energy intersects with YOUR current phase' },
            { icon: '⚡', title: 'Primary Influence', desc: 'Where the energy hits hardest for your numbers' },
            { icon: '🌊', title: 'Flow Points', desc: 'What\'s supported — where to lean in' },
            { icon: '⚠️', title: 'Friction Points', desc: 'Where resistance may arise — not to fight, but notice' },
            { icon: '🔮', title: 'Integration Guide', desc: 'Practical rituals for morning, 11:11, and evening' },
            { icon: '📋', title: 'Your Summary', desc: 'Key insights + personalized affirmation' },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 p-4 bg-slate-900/30 rounded-xl">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h4 className="font-semibold text-white">{item.title}</h4>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Note */}
      <section className="text-center pb-12 px-6">
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Vyberology provides <strong>orientation, not prediction</strong>.
          Your choices remain yours. We provide clarity so you can navigate with greater awareness.
        </p>
      </section>
    </div>
  );
}
