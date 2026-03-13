/**
 * VYBEROLOGY V2.0 - READING PAGE
 * Mystic Minimal Aesthetic
 * Route: /v2/reading
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReadingScreen } from '@/components/v2/reading/ReadingScreen';
import { sampleAirReading } from '@/components/v2/demo/sample-readings';
import { colors, typography, spacing } from '@/components/v2/styles/tokens';

export const V2Reading: React.FC = () => {
  const navigate = useNavigate();

  // TODO: Get reading from context/state management in Phase 3
  // For now, use sample data
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

  return (
    <div style={styles.container}>
      <ReadingScreen reading={reading} />

      {/* ACTION BUTTONS */}
      <div style={styles.actions}>
        <button
          onClick={() => navigate('/v2/share')}
          style={styles.primaryButton}
        >
          Generate Share Cards
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
          <button
            onClick={() => navigate('/v2/support')}
            style={styles.secondaryButton}
          >
            Support the Mission
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

  actions: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: spacing.xl,
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

export default V2Reading;
