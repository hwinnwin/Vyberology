/**
 * VYBEROLOGY V2.0 - SHARE CARD PREVIEW PAGE
 * Mystic Minimal Aesthetic
 * Route: /v2/share
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShareCardGenerator } from '@/components/v2/share/ShareCardGenerator';
import { ShareCardConfig } from '@/components/v2/types';
import { sampleAirReading } from '@/components/v2/demo/sample-readings';
import { colors, typography, spacing } from '@/components/v2/styles/tokens';

export const V2Share: React.FC = () => {
  const navigate = useNavigate();
  const [cardFormat, setCardFormat] = useState<'vertical' | 'square'>('vertical');

  // TODO: Get reading from context/state in Phase 3
  const reading = sampleAirReading;

  // Guard: If no reading, redirect to home
  if (!reading) {
    setTimeout(() => navigate('/v2'), 0);
    return (
      <div style={styles.messageContainer}>
        <p style={styles.message}>No reading found. Redirecting...</p>
      </div>
    );
  }

  const shareConfig: ShareCardConfig = {
    format: cardFormat,
    reading,
    includeWatermark: true,
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>Share Your Reading</h1>
        <p style={styles.subtitle}>Download and share your vybe</p>
      </div>

      {/* FORMAT TOGGLE */}
      <div style={styles.controls}>
        <label style={styles.label}>Card Format:</label>
        <div style={styles.buttonGroup}>
          <button
            style={{
              ...styles.formatButton,
              ...(cardFormat === 'vertical' ? styles.formatButtonActive : {}),
            }}
            onClick={() => setCardFormat('vertical')}
          >
            Story (1080×1920)
          </button>
          <button
            style={{
              ...styles.formatButton,
              ...(cardFormat === 'square' ? styles.formatButtonActive : {}),
            }}
            onClick={() => setCardFormat('square')}
          >
            Square (1080×1080)
          </button>
        </div>
      </div>

      {/* SHARE CARD PREVIEW */}
      <div style={styles.previewSection}>
        <ShareCardGenerator config={shareConfig} />
      </div>

      {/* NAVIGATION ACTIONS */}
      <div style={styles.actions}>
        <button
          onClick={() => navigate('/v2/reading')}
          style={styles.primaryButton}
        >
          Back to Reading
        </button>

        <div style={styles.secondaryActions}>
          <button
            onClick={() => navigate('/v2')}
            style={styles.secondaryButton}
          >
            New Reading
          </button>
          <button
            onClick={() => navigate('/v2/history')}
            style={styles.secondaryButton}
          >
            View History
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: colors.softIvory,
    fontFamily: typography.primary,
    paddingBottom: spacing.xl,
  },

  messageContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.softIvory,
  },

  message: {
    fontFamily: typography.body.family,
    fontSize: typography.body.size,
    color: colors.midnightCharcoal,
    opacity: 0.7,
  },

  header: {
    background: colors.midnightCharcoal,
    color: colors.softIvory,
    padding: spacing.lg,
    textAlign: 'center',
  },

  title: {
    fontFamily: typography.h1.family,
    fontSize: '32px',
    fontWeight: '400',
    letterSpacing: typography.h1.letterSpacing,
    margin: 0,
    marginBottom: spacing.xs,
  },

  subtitle: {
    fontFamily: typography.body.family,
    fontSize: '16px',
    fontWeight: '300',
    margin: 0,
    opacity: 0.8,
  },

  controls: {
    padding: spacing.md,
    background: colors.warmQuartz,
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.sm,
  },

  label: {
    fontFamily: typography.label.family,
    fontSize: typography.label.size,
    fontWeight: typography.label.weight,
    textTransform: 'uppercase',
    letterSpacing: typography.label.letterSpacing,
    color: colors.midnightCharcoal,
  },

  buttonGroup: {
    display: 'flex',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  formatButton: {
    fontFamily: typography.body.family,
    fontSize: '14px',
    fontWeight: '600',
    padding: '10px 20px',
    background: colors.softIvory,
    color: colors.midnightCharcoal,
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 120ms ease-out',
  },

  formatButtonActive: {
    background: colors.midnightCharcoal,
    color: colors.softIvory,
    borderColor: colors.midnightCharcoal,
  },

  previewSection: {
    padding: spacing.md,
  },

  actions: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },

  primaryButton: {
    fontFamily: typography.body.family,
    fontSize: '18px',
    fontWeight: '600',
    padding: '16px 32px',
    background: colors.midnightCharcoal,
    color: colors.softIvory,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 120ms ease-out',
  },

  secondaryActions: {
    display: 'flex',
    gap: spacing.sm,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },

  secondaryButton: {
    fontFamily: typography.body.family,
    fontSize: '14px',
    fontWeight: '500',
    padding: '12px 24px',
    background: 'transparent',
    color: colors.midnightCharcoal,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 120ms ease-out',
  },
};

export default V2Share;
