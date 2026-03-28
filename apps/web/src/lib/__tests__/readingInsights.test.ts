import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock readingHistory before importing
vi.mock('../readingHistory', () => ({
  getReadingHistory: vi.fn(() => []),
  getRecurringPatterns: vi.fn(() => []),
}));

import { analyseReadingPatterns, buildLumynGreeting } from '../readingInsights';
import { getReadingHistory } from '../readingHistory';
import type { HistoricalReading } from '../readingHistory';

function makeReading(overrides: Partial<HistoricalReading> & { inputValue: string; reading: string }): HistoricalReading {
  return {
    id: `test-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    inputType: 'manual',
    ...overrides,
  };
}

describe('readingInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyseReadingPatterns', () => {
    it('returns empty summary when no history', () => {
      vi.mocked(getReadingHistory).mockReturnValue([]);

      const result = analyseReadingPatterns();
      expect(result.totalReadings).toBe(0);
      expect(result.readingsThisWeek).toBe(0);
      expect(result.readingsThisMonth).toBe(0);
      expect(result.dominantNumbers).toEqual([]);
      expect(result.topPatterns).toEqual([]);
      expect(result.insights).toEqual([]);
      expect(result.contextSummary).toBe('No readings yet.');
      expect(result.lastReadingAt).toBeNull();
      expect(result.daysSinceLastReading).toBeNull();
    });

    it('counts total readings', () => {
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '111', reading: 'Test reading one' }),
        makeReading({ inputValue: '222', reading: 'Test reading two' }),
      ]);

      const result = analyseReadingPatterns();
      expect(result.totalReadings).toBe(2);
    });

    it('counts readings this week and month', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '111', reading: 'Recent', timestamp: now.toISOString() }),
        makeReading({ inputValue: '222', reading: 'This week', timestamp: twoDaysAgo.toISOString() }),
        makeReading({ inputValue: '333', reading: 'Older', timestamp: twoWeeksAgo.toISOString() }),
      ]);

      const result = analyseReadingPatterns();
      expect(result.readingsThisWeek).toBe(2);
      expect(result.readingsThisMonth).toBe(3);
    });

    it('calculates daysSinceLastReading', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '111', reading: 'Test', timestamp: threeDaysAgo.toISOString() }),
      ]);

      const result = analyseReadingPatterns();
      expect(result.daysSinceLastReading).toBe(3);
      expect(result.lastReadingAt).toBe(threeDaysAgo.toISOString());
    });

    it('extracts dominant numbers from inputValue', () => {
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '111', reading: 'Test' }),
        makeReading({ inputValue: '111', reading: 'Test' }),
        makeReading({ inputValue: '222', reading: 'Test' }),
      ]);

      const result = analyseReadingPatterns();
      expect(result.dominantNumbers[0].number).toBe('111');
      expect(result.dominantNumbers[0].count).toBe(2);
    });

    it('counts numbers from the numbers array', () => {
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: 'abc', reading: 'Test', numbers: ['7', '7', '7'] }),
      ]);

      const result = analyseReadingPatterns();
      const seven = result.dominantNumbers.find(d => d.number === '7');
      expect(seven?.count).toBe(3);
    });

    it('generates dominant_number insight when count >= 3', () => {
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '11', reading: 'Test' }),
        makeReading({ inputValue: '11', reading: 'Test' }),
        makeReading({ inputValue: '11', reading: 'Test' }),
      ]);

      const result = analyseReadingPatterns();
      const insight = result.insights.find(i => i.type === 'dominant_number');
      expect(insight).toBeDefined();
      expect(insight!.label).toContain('11');
      expect(insight!.significance).toBe('medium');
    });

    it('marks dominant_number as high significance when count >= 5', () => {
      vi.mocked(getReadingHistory).mockReturnValue(
        Array.from({ length: 5 }, () =>
          makeReading({ inputValue: '33', reading: 'Test' })
        )
      );

      const result = analyseReadingPatterns();
      const insight = result.insights.find(i => i.type === 'dominant_number');
      expect(insight?.significance).toBe('high');
    });

    it('generates returning_number insight for repeating numbers in last 3 readings', () => {
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '42', reading: 'Test' }),
        makeReading({ inputValue: '42', reading: 'Test' }),
        makeReading({ inputValue: '99', reading: 'Test' }),
      ]);

      const result = analyseReadingPatterns();
      const insight = result.insights.find(i => i.type === 'returning_number');
      expect(insight).toBeDefined();
      expect(insight!.label).toContain('42');
    });

    it('generates chakra_streak insight when chakra appears >= 3 times', () => {
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '1', reading: 'Your Heart chakra is open' }),
        makeReading({ inputValue: '2', reading: 'Heart energy flows' }),
        makeReading({ inputValue: '3', reading: 'Heart centered today' }),
      ]);

      const result = analyseReadingPatterns();
      const insight = result.insights.find(i => i.type === 'chakra_streak');
      expect(insight).toBeDefined();
      expect(insight!.label).toContain('Heart');
    });

    it('generates element_streak insight when element appears >= 3 times', () => {
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '1', reading: 'Fire energy burns bright' }),
        makeReading({ inputValue: '2', reading: 'Fire is your element' }),
        makeReading({ inputValue: '3', reading: 'Embrace your fire nature' }),
      ]);

      const result = analyseReadingPatterns();
      const insight = result.insights.find(i => i.type === 'element_streak');
      expect(insight).toBeDefined();
      expect(insight!.label).toContain('Fire');
    });

    it('generates frequency_spike insight when weekly readings > 1.5x average and >= 3', () => {
      const now = new Date();
      // 3 readings this week, but total history spans several weeks
      const readings = [
        makeReading({ inputValue: '1', reading: 'Test', timestamp: now.toISOString() }),
        makeReading({ inputValue: '2', reading: 'Test', timestamp: new Date(now.getTime() - 86400000).toISOString() }),
        makeReading({ inputValue: '3', reading: 'Test', timestamp: new Date(now.getTime() - 2 * 86400000).toISOString() }),
        // Old reading to establish a low average
        makeReading({ inputValue: '4', reading: 'Test', timestamp: new Date(now.getTime() - 60 * 86400000).toISOString() }),
      ];
      vi.mocked(getReadingHistory).mockReturnValue(readings);

      const result = analyseReadingPatterns();
      const insight = result.insights.find(i => i.type === 'frequency_spike');
      expect(insight).toBeDefined();
      expect(insight!.label).toContain('Heightened awareness');
    });

    it('builds contextSummary with reading details', () => {
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '111', reading: 'Heart chakra reading text here' }),
      ]);

      const result = analyseReadingPatterns();
      expect(result.contextSummary).toContain('Total vybe captures: 1');
      expect(result.contextSummary).toContain('Most recent captures:');
      expect(result.contextSummary).toContain('111');
    });

    it('contextSummary shows "today" for readings from today', () => {
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '111', reading: 'Test', timestamp: new Date().toISOString() }),
      ]);

      const result = analyseReadingPatterns();
      expect(result.contextSummary).toContain('today');
    });

    it('contextSummary shows "yesterday" for readings from yesterday', () => {
      const yesterday = new Date(Date.now() - 86400000);
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '111', reading: 'Test', timestamp: yesterday.toISOString() }),
      ]);

      const result = analyseReadingPatterns();
      expect(result.contextSummary).toContain('yesterday');
    });

    it('contextSummary includes chakra and element info', () => {
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '111', reading: 'Crown chakra Water energy' }),
      ]);

      const result = analyseReadingPatterns();
      expect(result.contextSummary).toContain('Crown');
      expect(result.contextSummary).toContain('Water');
    });

    it('includes reflection in contextSummary when present', () => {
      const reading = makeReading({ inputValue: '111', reading: 'Test reading' });
      (reading as any).reflection = 'A powerful insight';
      vi.mocked(getReadingHistory).mockReturnValue([reading]);

      const result = analyseReadingPatterns();
      expect(result.contextSummary).toContain('A powerful insight');
    });

    it('limits dominantNumbers to top 5', () => {
      const readings = Array.from({ length: 10 }, (_, i) =>
        makeReading({ inputValue: String(i * 100), reading: 'Test' })
      );
      vi.mocked(getReadingHistory).mockReturnValue(readings);

      const result = analyseReadingPatterns();
      expect(result.dominantNumbers.length).toBeLessThanOrEqual(5);
    });

    it('limits topPatterns to top 8', () => {
      const readings = Array.from({ length: 20 }, (_, i) =>
        makeReading({ inputValue: String(i * 100), reading: 'Test' })
      );
      vi.mocked(getReadingHistory).mockReturnValue(readings);

      const result = analyseReadingPatterns();
      expect(result.topPatterns.length).toBeLessThanOrEqual(8);
    });
  });

  describe('buildLumynGreeting', () => {
    it('returns null when no history', () => {
      vi.mocked(getReadingHistory).mockReturnValue([]);
      expect(buildLumynGreeting()).toBeNull();
    });

    it('greets with "Welcome back" for same-day reading', () => {
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '111', reading: 'Test', timestamp: new Date().toISOString() }),
      ]);

      const greeting = buildLumynGreeting();
      expect(greeting).toContain('Welcome back');
    });

    it('greets with "Good to see you" for yesterday reading', () => {
      const yesterday = new Date(Date.now() - 86400000);
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '111', reading: 'Test', timestamp: yesterday.toISOString() }),
      ]);

      const greeting = buildLumynGreeting();
      expect(greeting).toContain('Good to see you');
    });

    it('shows days count for 2-7 day gap', () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 86400000);
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '111', reading: 'Test', timestamp: fiveDaysAgo.toISOString() }),
      ]);

      const greeting = buildLumynGreeting();
      expect(greeting).toContain('5 days');
    });

    it('shows "been away" for gap > 7 days', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '111', reading: 'Test', timestamp: twoWeeksAgo.toISOString() }),
      ]);

      const greeting = buildLumynGreeting();
      expect(greeting).toContain('been away');
    });

    it('includes display name when provided', () => {
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '111', reading: 'Test', timestamp: new Date().toISOString() }),
      ]);

      const greeting = buildLumynGreeting('Jane Smith');
      expect(greeting).toContain('Jane');
    });

    it('references last captured value', () => {
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '11:11', reading: 'Test', timestamp: new Date().toISOString() }),
      ]);

      const greeting = buildLumynGreeting();
      expect(greeting).toContain('11:11');
    });

    it('includes reflection text when present', () => {
      const reading = makeReading({ inputValue: '111', reading: 'Test', timestamp: new Date().toISOString() });
      (reading as any).reflection = 'Your energy is shifting';
      vi.mocked(getReadingHistory).mockReturnValue([reading]);

      const greeting = buildLumynGreeting();
      expect(greeting).toContain('Your energy is shifting');
    });

    it('includes high significance insight in greeting', () => {
      // 3+ occurrences of same number in last 3 => returning_number (high significance)
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '42', reading: 'Test', timestamp: new Date().toISOString() }),
        makeReading({ inputValue: '42', reading: 'Test', timestamp: new Date().toISOString() }),
        makeReading({ inputValue: '42', reading: 'Test', timestamp: new Date().toISOString() }),
      ]);

      const greeting = buildLumynGreeting();
      expect(greeting).toContain('42');
    });

    it('always ends with "What\'s alive for you today?"', () => {
      vi.mocked(getReadingHistory).mockReturnValue([
        makeReading({ inputValue: '111', reading: 'Test', timestamp: new Date().toISOString() }),
      ]);

      const greeting = buildLumynGreeting();
      expect(greeting).toContain("What's alive for you today?");
    });
  });
});
