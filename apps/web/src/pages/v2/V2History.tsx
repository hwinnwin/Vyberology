/**
 * VYBEROLOGY V2.0 - READING HISTORY PAGE
 * Mystic Minimal Aesthetic
 * Route: /v2/history
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, layout } from '@/components/v2/styles/tokens';
import { Calendar } from 'lucide-react';

// TODO: Wire to actual history storage in Phase 3
// For now, show empty state

export const V2History: React.FC = () => {
  const navigate = useNavigate();

  // Placeholder - will be replaced with actual history data
  const readings: any[] = [];

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* HEADER */}
        <div style={styles.header}>
          <Calendar size={32} color={colors.midnightCharcoal} />
          <h1 style={styles.title}>Reading History</h1>
          <p style={styles.subtitle}>Your personal journey timeline</p>
        </div>

        {/* EMPTY STATE */}
        {readings.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Calendar size={64} color={colors.midnightCharcoal} style={{ opacity: 0.2 }} />
            </div>
            <p style={styles.emptyTitle}>No readings yet</p>
            <p style={styles.emptyText}>
              Start with your first reading to begin tracking your journey of alignment.
            </p>
            <button
              onClick={() => navigate('/v2')}
              style={styles.startButton}
            >
              Start a Reading
            </button>
          </div>
        )}

        {/* READING LIST (for when history exists) */}
        {readings.length > 0 && (
          <div style={styles.listContainer}>
            {readings.map((reading: any, index: number) => (
              <div key={index} style={styles.readingCard}>
                {/* Reading card content will go here */}
                <p style={styles.markerTitle}>{reading.markerTitle}</p>
                <p style={styles.timestamp}>{reading.createdAt}</p>
                {/* Element + Chakra badges */}
                {/* Essence line snippet */}
                {/* Click → navigate to /v2/reading with that reading */}
              </div>
            ))}
          </div>
        )}

        {/* BACK BUTTON */}
        <div style={styles.actions}>
          <button
            onClick={() => navigate('/v2')}
            style={styles.backButton}
          >
            Back to Home
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

  content: {
    maxWidth: layout.maxWidth,
    width: '100%',
    margin: '0 auto',
    padding: spacing.xl,
    paddingTop: '80px',
  },

  header: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.sm,
  },

  title: {
    fontFamily: typography.h1.family,
    fontSize: '36px',
    fontWeight: '400',
    letterSpacing: typography.h1.letterSpacing,
    color: colors.midnightCharcoal,
    margin: 0,
  },

  subtitle: {
    fontFamily: typography.body.family,
    fontSize: '16px',
    fontWeight: '300',
    color: colors.midnightCharcoal,
    opacity: 0.7,
    margin: 0,
  },

  emptyState: {
    textAlign: 'center',
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },

  emptyIcon: {
    marginBottom: spacing.lg,
  },

  emptyTitle: {
    fontFamily: typography.body.family,
    fontSize: '24px',
    fontWeight: '600',
    color: colors.midnightCharcoal,
    marginBottom: spacing.sm,
  },

  emptyText: {
    fontFamily: typography.body.family,
    fontSize: typography.body.size,
    lineHeight: typography.body.lineHeight,
    color: colors.midnightCharcoal,
    opacity: 0.7,
    maxWidth: '400px',
    margin: '0 auto',
    marginBottom: spacing.lg,
  },

  startButton: {
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

  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  readingCard: {
    background: colors.warmQuartz,
    border: `1px solid ${colors.border}`,
    borderRadius: layout.borderRadius,
    padding: spacing.md,
    cursor: 'pointer',
    transition: 'all 120ms ease-out',
  },

  markerTitle: {
    fontFamily: typography.body.family,
    fontSize: '18px',
    fontWeight: '600',
    color: colors.midnightCharcoal,
    margin: 0,
    marginBottom: spacing.xs,
  },

  timestamp: {
    fontFamily: typography.label.family,
    fontSize: typography.label.size,
    color: colors.midnightCharcoal,
    opacity: 0.5,
    margin: 0,
  },

  actions: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },

  backButton: {
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
};

export default V2History;
