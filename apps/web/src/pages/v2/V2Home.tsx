/**
 * VYBEROLOGY V2.0 - HOME / INPUT SCREEN
 * Mystic Minimal Aesthetic
 * Route: /v2
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, layout } from '@/components/v2/styles/tokens';
import { Sparkles } from 'lucide-react';

export const V2Home: React.FC = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerateReading = async () => {
    if (!inputValue.trim()) {
      return;
    }

    setIsProcessing(true);

    // TODO: Wire to engine when Phase 3 complete
    // For now, navigate to demo with sample data
    setTimeout(() => {
      navigate('/v2/reading');
      setIsProcessing(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing) {
      handleGenerateReading();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* LOGO + TAGLINE */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <Sparkles size={32} color={colors.midnightCharcoal} />
            <h1 style={styles.logo}>VYBEROLOGY</h1>
          </div>
          <p style={styles.tagline}>Decode your life's frequency</p>
        </div>

        {/* EXPLAINER */}
        <div style={styles.explainer}>
          <p style={styles.explainerText}>
            Enter your numbers or upload a screenshot to receive your reading.
          </p>
        </div>

        {/* INPUT SECTION */}
        <div style={styles.inputSection}>
          <input
            type="text"
            placeholder="Enter numbers (e.g., 1, 4, 4 or 144)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isProcessing}
            style={styles.input}
          />

          <button
            onClick={handleGenerateReading}
            disabled={!inputValue.trim() || isProcessing}
            style={{
              ...styles.button,
              ...((!inputValue.trim() || isProcessing) ? styles.buttonDisabled : {}),
            }}
          >
            {isProcessing ? 'Generating...' : 'Generate Reading'}
          </button>

          {/* OPTIONAL: Upload screenshot (Phase 3 - OCR integration) */}
          <button
            style={styles.uploadButton}
            disabled
            title="Coming in Phase 3"
          >
            Upload Screenshot (Coming Soon)
          </button>
        </div>

        {/* QUICK LINKS */}
        <div style={styles.links}>
          <a href="/v2/history" style={styles.link}>View History</a>
          <span style={styles.linkSeparator}>•</span>
          <a href="/v2/support" style={styles.link}>Support the Mission</a>
          <span style={styles.linkSeparator}>•</span>
          <a href="/about" style={styles.link}>Learn More</a>
        </div>
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          Vyberology is <strong>Free Forever</strong>
        </p>
        <p style={styles.footerText}>
          Built with sovereignty • No pressure • No comparison
        </p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: colors.softIvory,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    fontFamily: typography.primary,
  },

  content: {
    maxWidth: layout.maxWidth,
    width: '100%',
    margin: '0 auto',
    padding: spacing.xl,
    paddingTop: '120px',
  },

  header: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  logo: {
    fontFamily: typography.h1.family,
    fontSize: '42px',
    fontWeight: '400',
    letterSpacing: typography.h1.letterSpacing,
    color: colors.midnightCharcoal,
    margin: 0,
  },

  tagline: {
    fontFamily: typography.body.family,
    fontSize: '18px',
    fontWeight: '300',
    color: colors.midnightCharcoal,
    opacity: 0.7,
    margin: 0,
  },

  explainer: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  explainerText: {
    fontFamily: typography.body.family,
    fontSize: typography.body.size,
    lineHeight: typography.body.lineHeight,
    color: colors.midnightCharcoal,
    maxWidth: '480px',
    margin: '0 auto',
  },

  inputSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  input: {
    fontFamily: typography.body.family,
    fontSize: '18px',
    padding: '16px 20px',
    border: `1px solid ${colors.border}`,
    borderRadius: layout.borderRadius,
    background: colors.warmQuartz,
    color: colors.midnightCharcoal,
    outline: 'none',
    transition: 'border-color 120ms ease-out',
  },

  button: {
    fontFamily: typography.body.family,
    fontSize: '18px',
    fontWeight: '600',
    padding: '16px 32px',
    background: colors.midnightCharcoal,
    color: colors.softIvory,
    border: 'none',
    borderRadius: layout.borderRadius,
    cursor: 'pointer',
    transition: 'all 120ms ease-out',
  },

  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },

  uploadButton: {
    fontFamily: typography.body.family,
    fontSize: '14px',
    fontWeight: '500',
    padding: '12px 24px',
    background: 'transparent',
    color: colors.midnightCharcoal,
    border: `1px solid ${colors.border}`,
    borderRadius: layout.borderRadius,
    cursor: 'not-allowed',
    opacity: 0.4,
  },

  links: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },

  link: {
    fontFamily: typography.label.family,
    fontSize: typography.label.size,
    fontWeight: typography.label.weight,
    textTransform: 'uppercase',
    letterSpacing: typography.label.letterSpacing,
    color: colors.midnightCharcoal,
    textDecoration: 'none',
    transition: 'opacity 120ms ease-out',
  },

  linkSeparator: {
    color: colors.midnightCharcoal,
    opacity: 0.3,
  },

  footer: {
    background: colors.midnightCharcoal,
    color: colors.softIvory,
    padding: spacing.md,
    textAlign: 'center',
  },

  footerText: {
    fontFamily: typography.body.family,
    fontSize: '14px',
    margin: '4px 0',
    opacity: 0.8,
  },
};

export default V2Home;
