/**
 * VYBEROLOGY V2.0 - DEMO PAGE
 * Showcases ReadingScreen + ShareCardGenerator
 * Mystic Minimal Aesthetic
 */

import React, { useState } from 'react';
import { ReadingScreen } from '../reading/ReadingScreen';
import { ShareCardGenerator } from '../share/ShareCardGenerator';
import { ReadingData, ShareCardConfig } from '../types';
import { colors, typography, spacing } from '../styles/tokens';
import {
  sampleFireReading,
  sampleEarthReading,
  sampleAirReading,
  sampleWaterReading,
  sampleMaster11Reading,
} from './sample-readings';
import {
  allSampleReadings,
  sampleReadingsByLength,
  sampleReadingsByElement,
  sampleReadingsWithMasterNumbers,
} from './sample-readings-pack';

// Original 5 readings for backwards compatibility
const originalReadings: Record<string, ReadingData> = {
  fire: sampleFireReading,
  earth: sampleEarthReading,
  air: sampleAirReading,
  water: sampleWaterReading,
  master11: sampleMaster11Reading,
};

type ReadingLength = 'short' | 'medium' | 'long';
type ReadingSource = 'original' | 'pack';

export const V2Demo: React.FC = () => {
  const [currentElement, setCurrentElement] = useState<'air' | 'fire' | 'earth' | 'water' | 'master11'>('air');
  const [shareFormat, setShareFormat] = useState<'vertical' | 'square'>('vertical');
  const [activeTab, setActiveTab] = useState<'reading' | 'share'>('reading');
  const [readingSource, setReadingSource] = useState<ReadingSource>('original');
  const [readingLength, setReadingLength] = useState<ReadingLength>('medium');
  const [readingIndex, setReadingIndex] = useState(0);

  // Get current reading based on source and filters
  const currentReading = readingSource === 'original'
    ? originalReadings[currentElement]
    : sampleReadingsByLength[readingLength][readingIndex] || sampleReadingsByLength[readingLength][0];

  const shareConfig: ShareCardConfig = {
    format: shareFormat,
    reading: currentReading,
    includeWatermark: true,
  };

  return (
    <div style={styles.demoContainer}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>VYBEROLOGY V2.0 - MYSTIC MINIMAL</h1>
        <p style={styles.subtitle}>Prototype Demo</p>
      </div>

      {/* TAB NAVIGATION */}
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'reading' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('reading')}
        >
          Reading Screen
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'share' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('share')}
        >
          Share Cards
        </button>
      </div>

      {/* READING SOURCE SELECTOR */}
      <div style={styles.controls}>
        <label style={styles.label}>Reading Source:</label>
        <div style={styles.buttonGroup}>
          <button
            style={{
              ...styles.elementButton,
              ...(readingSource === 'original' ? styles.elementButtonActive : {}),
            }}
            onClick={() => setReadingSource('original')}
          >
            ORIGINAL (5)
          </button>
          <button
            style={{
              ...styles.elementButton,
              ...(readingSource === 'pack' ? styles.elementButtonActive : {}),
            }}
            onClick={() => setReadingSource('pack')}
          >
            SAMPLE PACK (30)
          </button>
        </div>
      </div>

      {/* ORIGINAL READINGS - ELEMENT SWITCHER */}
      {readingSource === 'original' && (
        <div style={styles.controls}>
          <label style={styles.label}>Select Reading:</label>
          <div style={styles.buttonGroup}>
            {(['air', 'fire', 'earth', 'water', 'master11'] as const).map((element) => (
              <button
                key={element}
                style={{
                  ...styles.elementButton,
                  ...(currentElement === element ? styles.elementButtonActive : {}),
                }}
                onClick={() => setCurrentElement(element)}
              >
                {element === 'master11' ? 'MASTER 11' : element.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SAMPLE PACK - LENGTH + INDEX SELECTOR */}
      {readingSource === 'pack' && (
        <>
          <div style={styles.controls}>
            <label style={styles.label}>Reading Length:</label>
            <div style={styles.buttonGroup}>
              {(['short', 'medium', 'long'] as const).map((length) => (
                <button
                  key={length}
                  style={{
                    ...styles.elementButton,
                    ...(readingLength === length ? styles.elementButtonActive : {}),
                  }}
                  onClick={() => {
                    setReadingLength(length);
                    setReadingIndex(0);
                  }}
                >
                  {length.toUpperCase()} ({sampleReadingsByLength[length].length})
                </button>
              ))}
            </div>
          </div>
          <div style={styles.controls}>
            <label style={styles.label}>
              Reading {readingIndex + 1} of {sampleReadingsByLength[readingLength].length}
            </label>
            <div style={styles.buttonGroup}>
              <button
                style={styles.elementButton}
                onClick={() => setReadingIndex(Math.max(0, readingIndex - 1))}
                disabled={readingIndex === 0}
              >
                ← PREVIOUS
              </button>
              <button
                style={styles.elementButton}
                onClick={() => setReadingIndex(Math.min(sampleReadingsByLength[readingLength].length - 1, readingIndex + 1))}
                disabled={readingIndex === sampleReadingsByLength[readingLength].length - 1}
              >
                NEXT →
              </button>
            </div>
          </div>
        </>
      )}

      {/* CONTENT */}
      {activeTab === 'reading' && (
        <div style={styles.contentSection}>
          <ReadingScreen reading={currentReading} />
        </div>
      )}

      {activeTab === 'share' && (
        <div style={styles.contentSection}>
          <div style={styles.controls}>
            <label style={styles.label}>Card Format:</label>
            <div style={styles.buttonGroup}>
              <button
                style={{
                  ...styles.formatButton,
                  ...(shareFormat === 'vertical' ? styles.elementButtonActive : {}),
                }}
                onClick={() => setShareFormat('vertical')}
              >
                Vertical (1080x1920)
              </button>
              <button
                style={{
                  ...styles.formatButton,
                  ...(shareFormat === 'square' ? styles.elementButtonActive : {}),
                }}
                onClick={() => setShareFormat('square')}
              >
                Square (1080x1080)
              </button>
            </div>
          </div>
          <ShareCardGenerator config={shareConfig} />
        </div>
      )}

      {/* FOOTER */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          Built by Guardian Leader following Mystic Minimal visual specification
        </p>
        <p style={styles.footerText}>
          Awaiting Lumen approval for integration into Vyberology V2.0
        </p>
      </div>
    </div>
  );
};

export default V2Demo;

const styles: Record<string, React.CSSProperties> = {
  demoContainer: {
    minHeight: '100vh',
    background: colors.softIvory,
    fontFamily: typography.primary,
  },

  header: {
    background: colors.midnightCharcoal,
    color: colors.softIvory,
    padding: spacing.xl,
    textAlign: 'center',
  },

  title: {
    fontFamily: typography.h1.family,
    fontSize: '36px',
    fontWeight: '400',
    margin: 0,
    marginBottom: spacing.sm,
    letterSpacing: '0.05em',
  },

  subtitle: {
    fontFamily: typography.body.family,
    fontSize: '18px',
    fontWeight: '300',
    margin: 0,
    opacity: 0.8,
  },

  tabContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    background: colors.warmQuartz,
    borderBottom: `1px solid ${colors.border}`,
  },

  tab: {
    fontFamily: typography.body.family,
    fontSize: '16px',
    fontWeight: '500',
    padding: '12px 32px',
    background: 'transparent',
    color: colors.midnightCharcoal,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 120ms ease-out',
  },

  tabActive: {
    background: colors.midnightCharcoal,
    color: colors.softIvory,
    borderColor: colors.midnightCharcoal,
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
    textTransform: 'uppercase' as const,
    letterSpacing: typography.label.letterSpacing,
    color: colors.midnightCharcoal,
  },

  buttonGroup: {
    display: 'flex',
    gap: spacing.sm,
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },

  elementButton: {
    fontFamily: typography.body.family,
    fontSize: '14px',
    fontWeight: '600',
    padding: '8px 20px',
    background: colors.softIvory,
    color: colors.midnightCharcoal,
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 120ms ease-out',
  },

  elementButtonActive: {
    background: colors.midnightCharcoal,
    color: colors.softIvory,
    borderColor: colors.midnightCharcoal,
  },

  formatButton: {
    fontFamily: typography.body.family,
    fontSize: '14px',
    fontWeight: '600',
    padding: '8px 20px',
    background: colors.softIvory,
    color: colors.midnightCharcoal,
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 120ms ease-out',
  },

  contentSection: {
    minHeight: '60vh',
  },

  footer: {
    background: colors.midnightCharcoal,
    color: colors.softIvory,
    padding: spacing.xl,
    textAlign: 'center',
    marginTop: spacing.xl,
  },

  footerText: {
    fontFamily: typography.body.family,
    fontSize: '14px',
    margin: '8px 0',
    opacity: 0.7,
  },
};
