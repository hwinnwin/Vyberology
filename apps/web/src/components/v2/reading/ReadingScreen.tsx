/**
 * VYBEROLOGY V2.0 - READING SCREEN
 * Mystic Minimal Aesthetic
 */

import React from 'react';
import { ReadingData } from '../types';
import { colors, typography, spacing, layout, gradients, elements, chakras, intentionBox } from '../styles/tokens';

interface ReadingScreenProps {
  reading: ReadingData;
}

export const ReadingScreen: React.FC<ReadingScreenProps> = ({ reading }) => {
  const elementConfig = elements[reading.element];
  // Handle legacy chakra format conversion
  const chakraKey = reading.chakra === 'thirdEye' ? 'third-eye' : reading.chakra;
  const chakraConfig = chakras[chakraKey as keyof typeof chakras];
  // Support both resonanceText (new) and resonance (legacy)
  const resonanceText = reading.resonanceText || reading.resonance || '';

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* 1. MARKER TITLE */}
        <div style={styles.markerTitleContainer}>
          <h1 style={styles.markerTitle}>{reading.markerTitle}</h1>
        </div>

        {/* 2. ELEMENT */}
        <div style={styles.elementContainer}>
          <div style={styles.glyphContainer}>
            <span style={styles.glyph}>{elementConfig.glyph}</span>
          </div>
          <span style={{...styles.label, color: elementConfig.color}}>
            {elementConfig.label}
          </span>
        </div>

        {/* 3. CHAKRA */}
        <div style={styles.chakraContainer}>
          <div
            style={{
              ...styles.chakraDot,
              backgroundColor: chakraConfig.color,
              opacity: chakraConfig.opacity,
            }}
          />
          <span style={styles.chakraLabel}>{chakraConfig.label}</span>
        </div>

        {/* 4. RESONANCE PARAGRAPH */}
        <div style={styles.section}>
          <p style={styles.resonance}>{resonanceText}</p>
        </div>

        {/* 5. ESSENCE LINE */}
        <div style={styles.section}>
          <p style={styles.essenceLine}>{reading.essenceLine}</p>
        </div>

        {/* 6. INTENTION */}
        <div style={styles.intentionContainer}>
          <p style={styles.intention}>{reading.intention}</p>
        </div>

        {/* 7. REFLECTION KEY */}
        <div style={styles.section}>
          <p style={styles.reflectionKey}>{reading.reflectionKey}</p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: gradients.airQuartzMist,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: spacing.md,
    fontFamily: typography.primary,
  },

  content: {
    maxWidth: layout.maxWidth,
    width: '100%',
    paddingTop: spacing.xl,
  },

  markerTitleContainer: {
    background: gradients.cosmicWhisper,
    padding: spacing.md,
    borderRadius: layout.borderRadius,
    marginBottom: spacing.lg,
  },

  markerTitle: {
    fontFamily: typography.h1.family,
    fontSize: typography.h1.size,
    fontWeight: typography.h1.weight,
    letterSpacing: typography.h1.letterSpacing,
    color: colors.midnightCharcoal,
    margin: 0,
    textAlign: 'center',
  },

  elementContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  glyphContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  glyph: {
    fontSize: '36px',
    lineHeight: 1,
  },

  label: {
    fontFamily: typography.label.family,
    fontSize: typography.label.size,
    fontWeight: typography.label.weight,
    textTransform: typography.label.transform as any,
    letterSpacing: typography.label.letterSpacing,
  },

  chakraContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },

  chakraDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },

  chakraLabel: {
    fontFamily: typography.label.family,
    fontSize: typography.label.size,
    fontWeight: typography.label.weight,
    textTransform: typography.label.transform as any,
    letterSpacing: typography.label.letterSpacing,
    color: colors.midnightCharcoal,
  },

  section: {
    marginBottom: spacing.lg,
  },

  resonance: {
    fontFamily: typography.body.family,
    fontSize: typography.body.size,
    fontWeight: '500',
    lineHeight: typography.body.lineHeight,
    color: colors.midnightCharcoal,
    margin: 0,
  },

  essenceLine: {
    // Lumen refinement: Use Inter for body text, not Cormorant
    fontFamily: typography.body.family,
    fontSize: typography.h3.size,
    fontWeight: '600',
    color: colors.midnightCharcoal,
    margin: 0,
  },

  intentionContainer: {
    // Lumen refinement: Specific intention box styling
    border: `${intentionBox.borderWidth} solid ${intentionBox.borderColor}`,
    borderRadius: intentionBox.borderRadius,
    padding: intentionBox.padding,
    background: intentionBox.background,
    marginBottom: spacing.lg,
  },

  intention: {
    fontFamily: typography.body.family,
    fontSize: typography.body.size,
    lineHeight: typography.body.lineHeight,
    color: colors.midnightCharcoal,
    margin: 0,
  },

  reflectionKey: {
    fontFamily: typography.subtext.family,
    fontSize: typography.subtext.size,
    fontWeight: typography.subtext.weight,
    fontStyle: 'italic',
    color: colors.midnightCharcoal,
    opacity: 0.7,
    margin: 0,
  },
};
