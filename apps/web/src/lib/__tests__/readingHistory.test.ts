import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock sentry before importing readingHistory
vi.mock('../sentry', () => ({
  captureError: vi.fn(),
}));

import {
  saveReading,
  getReadingHistory,
  getReadingById,
  deleteReading,
  clearHistory,
  getRecurringPatterns,
  getReadingsByDateRange,
  getReadingsByType,
} from '../readingHistory';

describe('readingHistory', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getReadingHistory', () => {
    it('returns empty array when no history exists', () => {
      expect(getReadingHistory()).toEqual([]);
    });

    it('returns parsed history from localStorage', () => {
      const mockHistory = [
        {
          id: 'test-1',
          timestamp: new Date().toISOString(),
          inputType: 'manual',
          inputValue: '111',
          reading: 'Test reading',
        },
      ];
      localStorage.setItem('vyberology_reading_history', JSON.stringify(mockHistory));
      expect(getReadingHistory()).toEqual(mockHistory);
    });

    it('returns empty array when localStorage has invalid JSON', () => {
      localStorage.setItem('vyberology_reading_history', 'invalid-json{');
      expect(getReadingHistory()).toEqual([]);
    });
  });

  describe('saveReading', () => {
    it('saves a reading to localStorage', () => {
      saveReading({
        inputType: 'manual',
        inputValue: '111',
        reading: 'Test reading content',
      });

      const history = getReadingHistory();
      expect(history).toHaveLength(1);
      expect(history[0].inputType).toBe('manual');
      expect(history[0].inputValue).toBe('111');
      expect(history[0].reading).toBe('Test reading content');
      expect(history[0].id).toBeTruthy();
      expect(history[0].timestamp).toBeTruthy();
    });

    it('prepends new reading (most recent first)', () => {
      saveReading({ inputType: 'manual', inputValue: '111', reading: 'First' });
      saveReading({ inputType: 'manual', inputValue: '222', reading: 'Second' });

      const history = getReadingHistory();
      expect(history[0].reading).toBe('Second');
      expect(history[1].reading).toBe('First');
    });

    it('limits history to 100 items', () => {
      for (let i = 0; i < 105; i++) {
        saveReading({
          inputType: 'manual',
          inputValue: String(i),
          reading: `Reading ${i}`,
        });
      }

      const history = getReadingHistory();
      expect(history.length).toBe(100);
    });

    it('saves reading with optional numbers array', () => {
      saveReading({
        inputType: 'pattern',
        inputValue: '11:11',
        reading: 'Master number reading',
        numbers: ['11', '111'],
      });

      const history = getReadingHistory();
      expect(history[0].numbers).toEqual(['11', '111']);
    });
  });

  describe('getReadingById', () => {
    it('returns the reading with matching id', () => {
      saveReading({ inputType: 'manual', inputValue: '123', reading: 'Test' });
      const history = getReadingHistory();
      const id = history[0].id;

      const found = getReadingById(id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(id);
    });

    it('returns undefined when id not found', () => {
      expect(getReadingById('nonexistent-id')).toBeUndefined();
    });
  });

  describe('deleteReading', () => {
    it('removes the reading with matching id', () => {
      saveReading({ inputType: 'manual', inputValue: '123', reading: 'Test' });
      const history = getReadingHistory();
      const id = history[0].id;

      deleteReading(id);
      expect(getReadingHistory()).toHaveLength(0);
    });

    it('does not affect other readings', () => {
      saveReading({ inputType: 'manual', inputValue: '111', reading: 'First' });
      saveReading({ inputType: 'manual', inputValue: '222', reading: 'Second' });

      const history = getReadingHistory();
      const firstId = history[1].id; // history is most-recent first

      deleteReading(firstId);
      const remaining = getReadingHistory();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].reading).toBe('Second');
    });
  });

  describe('clearHistory', () => {
    it('removes all reading history', () => {
      saveReading({ inputType: 'manual', inputValue: '111', reading: 'Test' });
      clearHistory();
      expect(getReadingHistory()).toEqual([]);
    });

    it('does not throw when history is already empty', () => {
      expect(() => clearHistory()).not.toThrow();
    });
  });

  describe('getRecurringPatterns', () => {
    it('returns empty array when no history', () => {
      expect(getRecurringPatterns()).toEqual([]);
    });

    it('extracts and counts numbers from readings', () => {
      saveReading({ inputType: 'manual', inputValue: '111', reading: 'Test 1' });
      saveReading({ inputType: 'manual', inputValue: '111', reading: 'Test 2' });
      saveReading({ inputType: 'manual', inputValue: '222', reading: 'Test 3' });

      const patterns = getRecurringPatterns();
      expect(patterns.length).toBeGreaterThan(0);

      const pattern111 = patterns.find(p => p.pattern === '111');
      expect(pattern111?.count).toBe(2);
    });

    it('also counts stored numbers array', () => {
      saveReading({
        inputType: 'pattern',
        inputValue: 'abc',
        reading: 'Test',
        numbers: ['33', '33'],
      });

      const patterns = getRecurringPatterns();
      const pattern33 = patterns.find(p => p.pattern === '33');
      expect(pattern33?.count).toBe(2);
    });

    it('sorts patterns by count descending', () => {
      saveReading({ inputType: 'manual', inputValue: '111', reading: 'Test 1' });
      saveReading({ inputType: 'manual', inputValue: '111', reading: 'Test 2' });
      saveReading({ inputType: 'manual', inputValue: '222', reading: 'Test 3' });

      const patterns = getRecurringPatterns();
      for (let i = 1; i < patterns.length; i++) {
        expect(patterns[i - 1].count).toBeGreaterThanOrEqual(patterns[i].count);
      }
    });
  });

  describe('getReadingsByDateRange', () => {
    it('returns readings within date range', () => {
      saveReading({ inputType: 'manual', inputValue: '111', reading: 'Test' });

      const start = new Date(Date.now() - 60000); // 1 minute ago
      const end = new Date(Date.now() + 60000); // 1 minute from now

      const results = getReadingsByDateRange(start, end);
      expect(results).toHaveLength(1);
    });

    it('excludes readings outside date range', () => {
      saveReading({ inputType: 'manual', inputValue: '111', reading: 'Test' });

      const start = new Date(Date.now() + 60000); // in the future
      const end = new Date(Date.now() + 120000); // even further

      const results = getReadingsByDateRange(start, end);
      expect(results).toHaveLength(0);
    });
  });

  describe('getReadingsByType', () => {
    it('returns readings matching the type', () => {
      saveReading({ inputType: 'manual', inputValue: '111', reading: 'Manual reading' });
      saveReading({ inputType: 'time', inputValue: '11:11', reading: 'Time reading' });
      saveReading({ inputType: 'pattern', inputValue: '1234', reading: 'Pattern reading' });

      const manualReadings = getReadingsByType('manual');
      expect(manualReadings).toHaveLength(1);
      expect(manualReadings[0].reading).toBe('Manual reading');

      const timeReadings = getReadingsByType('time');
      expect(timeReadings).toHaveLength(1);
      expect(timeReadings[0].reading).toBe('Time reading');
    });

    it('returns empty array when no readings of that type', () => {
      saveReading({ inputType: 'manual', inputValue: '111', reading: 'Test' });
      expect(getReadingsByType('image')).toHaveLength(0);
    });
  });
});
