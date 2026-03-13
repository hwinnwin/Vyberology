/**
 * VYBEROLOGY V2.0 - SUPPORT THE MISSION (SOVEREIGNTY SCREEN)
 * Mystic Minimal Aesthetic + FREE FOREVER commitment
 * Route: /v2/support
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, layout } from '@/components/v2/styles/tokens';
import { Heart, Shield, Sparkles } from 'lucide-react';

export const V2Support: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* HEADER */}
        <div style={styles.header}>
          <Shield size={48} color={colors.midnightCharcoal} />
          <h1 style={styles.title}>Vyberology is Free Forever</h1>
        </div>

        {/* SOVEREIGNTY STATEMENT */}
        <div style={styles.section}>
          <p style={styles.paragraph}>
            <strong>This is a sovereignty-respecting space.</strong>
          </p>
          <p style={styles.paragraph}>
            Every core feature—readings, history, sharing—remains free, forever.
            There are no paywalls, no feature locks, no pressure to support.
          </p>
          <p style={styles.paragraph}>
            If Vyberology has been valuable to you and you're able to contribute,
            you're welcome to. If not, you're equally welcome here.
          </p>
        </div>

        {/* PRINCIPLES */}
        <div style={styles.principles}>
          <div style={styles.principle}>
            <Heart size={24} color={colors.midnightCharcoal} style={{ opacity: 0.7 }} />
            <div>
              <h3 style={styles.principleTitle}>No Suggested Amounts</h3>
              <p style={styles.principleText}>
                We won't tell you what to give. You know what works for you.
              </p>
            </div>
          </div>

          <div style={styles.principle}>
            <Sparkles size={24} color={colors.midnightCharcoal} style={{ opacity: 0.7 }} />
            <div>
              <h3 style={styles.principleTitle}>No Social Comparison</h3>
              <p style={styles.principleText}>
                No leaderboards, no badges, no "top supporters." Your capacity is yours.
              </p>
            </div>
          </div>

          <div style={styles.principle}>
            <Shield size={24} color={colors.midnightCharcoal} style={{ opacity: 0.7 }} />
            <div>
              <h3 style={styles.principleTitle}>No Blocked Features</h3>
              <p style={styles.principleText}>
                Free users get the full experience. Support is gratitude, not a requirement.
              </p>
            </div>
          </div>
        </div>

        {/* SUPPORT OPTIONS (PLACEHOLDER) */}
        <div style={styles.supportSection}>
          <p style={styles.supportIntro}>
            If you'd like to support Vyberology's development:
          </p>

          <div style={styles.buttonGroup}>
            <button
              style={styles.supportButton}
              disabled
              title="Payment integration coming in Phase 4"
            >
              Monthly Support (Coming Soon)
            </button>
            <button
              style={styles.supportButton}
              disabled
              title="Payment integration coming in Phase 4"
            >
              One-Time Support (Coming Soon)
            </button>
          </div>

          <button
            onClick={() => navigate(-1)}
            style={styles.returnButton}
          >
            Not Now — Return
          </button>
        </div>

        {/* COMMITMENT FOOTER */}
        <div style={styles.commitment}>
          <p style={styles.commitmentText}>
            <strong>Our Commitment:</strong> Vyberology will remain free for individuals, forever.
            No pivot. No rug pull. No "freemium upgrade." This is immutable.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: colors.softIvory,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    fontFamily: typography.primary,
  },

  content: {
    maxWidth: layout.maxWidth,
    width: '100%',
    padding: spacing.xl,
    paddingTop: '80px',
  },

  header: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.md,
  },

  title: {
    fontFamily: typography.h1.family,
    fontSize: '36px',
    fontWeight: '400',
    letterSpacing: typography.h1.letterSpacing,
    color: colors.midnightCharcoal,
    margin: 0,
  },

  section: {
    marginBottom: spacing.xl,
  },

  paragraph: {
    fontFamily: typography.body.family,
    fontSize: typography.body.size,
    lineHeight: typography.body.lineHeight,
    color: colors.midnightCharcoal,
    marginBottom: spacing.md,
  },

  principles: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },

  principle: {
    display: 'flex',
    gap: spacing.md,
    alignItems: 'flex-start',
  },

  principleTitle: {
    fontFamily: typography.body.family,
    fontSize: '18px',
    fontWeight: '600',
    color: colors.midnightCharcoal,
    margin: 0,
    marginBottom: spacing.xs,
  },

  principleText: {
    fontFamily: typography.body.family,
    fontSize: typography.body.size,
    lineHeight: typography.body.lineHeight,
    color: colors.midnightCharcoal,
    opacity: 0.7,
    margin: 0,
  },

  supportSection: {
    background: colors.warmQuartz,
    borderRadius: layout.borderRadius,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },

  supportIntro: {
    fontFamily: typography.body.family,
    fontSize: typography.body.size,
    color: colors.midnightCharcoal,
    marginBottom: spacing.md,
  },

  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  supportButton: {
    fontFamily: typography.body.family,
    fontSize: '16px',
    fontWeight: '600',
    padding: '16px 32px',
    background: colors.midnightCharcoal,
    color: colors.softIvory,
    border: 'none',
    borderRadius: layout.borderRadius,
    cursor: 'not-allowed',
    opacity: 0.4,
  },

  returnButton: {
    fontFamily: typography.body.family,
    fontSize: '14px',
    fontWeight: '500',
    padding: '12px 24px',
    background: 'transparent',
    color: colors.midnightCharcoal,
    border: `1px solid ${colors.border}`,
    borderRadius: layout.borderRadius,
    cursor: 'pointer',
    transition: 'all 120ms ease-out',
  },

  commitment: {
    background: colors.midnightCharcoal,
    color: colors.softIvory,
    borderRadius: layout.borderRadius,
    padding: spacing.md,
    textAlign: 'center',
  },

  commitmentText: {
    fontFamily: typography.body.family,
    fontSize: '14px',
    lineHeight: typography.body.lineHeight,
    margin: 0,
    opacity: 0.9,
  },
};

export default V2Support;
