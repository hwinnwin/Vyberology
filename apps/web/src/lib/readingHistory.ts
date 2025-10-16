// Reading History Management
// Stores and retrieves reading history from localStorage

import { captureError } from './sentry';

export interface HistoricalReading {
  id: string;
  timestamp: string;
  inputType: 'time' | 'pattern' | 'manual' | 'image';
  inputValue: string;
  reading: string;
  numbers?: string[]; // Extracted numbers from the reading
}

const STORAGE_KEY = 'vyberology_reading_history';
const MAX_HISTORY_ITEMS = 100;

/**
 * Generate a unique ID (fallback for older browsers)
 */
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for browsers without crypto.randomUUID (older Android WebView)
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Save a reading to history
 */
export const saveReading = (reading: Omit<HistoricalReading, 'id' | 'timestamp'>): void => {
  try {
    console.log('[ReadingHistory] Attempting to save reading:', reading.inputType, reading.inputValue);

    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
      console.error('[ReadingHistory] localStorage is not available');
      return;
    }

    const history = getReadingHistory();
    const newReading: HistoricalReading = {
      ...reading,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };

    console.log('[ReadingHistory] Created new reading with ID:', newReading.id);

    // Add to beginning of array (most recent first)
    history.unshift(newReading);

    // Limit history size
    if (history.length > MAX_HISTORY_ITEMS) {
      history.splice(MAX_HISTORY_ITEMS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    console.log('[ReadingHistory] Successfully saved. Total readings:', history.length);
  } catch (error) {
    console.error('[ReadingHistory] Failed to save reading to history:', error);
    if (error instanceof Error) {
      console.error('[ReadingHistory] Error details:', error.message, error.stack);

      // Report to Sentry
      captureError(error, {
        context: 'Reading History - Save Failed',
        level: 'error',
        tags: {
          feature: 'reading-history',
          operation: 'save',
        },
        extra: {
          inputType: reading.inputType,
          inputValue: reading.inputValue,
          historyLength: history.length,
        },
      });
    }
  }
};

/**
 * Get all reading history
 */
export const getReadingHistory = (): HistoricalReading[] => {
  try {
    if (typeof localStorage === 'undefined') {
      console.error('[ReadingHistory] localStorage is not available for reading');
      return [];
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    console.log('[ReadingHistory] Retrieved history, found:', stored ? 'data exists' : 'no data');

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    console.log('[ReadingHistory] Parsed history, count:', parsed.length);
    return parsed;
  } catch (error) {
    console.error('[ReadingHistory] Failed to load reading history:', error);
    if (error instanceof Error) {
      console.error('[ReadingHistory] Error details:', error.message);

      // Report to Sentry
      captureError(error, {
        context: 'Reading History - Load Failed',
        level: 'warning',
        tags: {
          feature: 'reading-history',
          operation: 'load',
        },
      });
    }
    return [];
  }
};

/**
 * Get reading by ID
 */
export const getReadingById = (id: string): HistoricalReading | undefined => {
  const history = getReadingHistory();
  return history.find(r => r.id === id);
};

/**
 * Delete a reading from history
 */
export const deleteReading = (id: string): void => {
  try {
    const history = getReadingHistory();
    const filtered = history.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete reading:', error);
  }
};

/**
 * Clear all reading history
 */
export const clearHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
};

/**
 * Get recurring patterns - numbers that appear frequently
 */
export const getRecurringPatterns = (): { pattern: string; count: number }[] => {
  const history = getReadingHistory();
  const patternCount: Record<string, number> = {};

  history.forEach(reading => {
    // Extract numbers from input value
    const numbers = extractNumbers(reading.inputValue);
    numbers.forEach(num => {
      patternCount[num] = (patternCount[num] || 0) + 1;
    });

    // Also count stored numbers if available
    if (reading.numbers) {
      reading.numbers.forEach(num => {
        patternCount[num] = (patternCount[num] || 0) + 1;
      });
    }
  });

  // Convert to array and sort by count
  return Object.entries(patternCount)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Extract numbers from a string
 */
const extractNumbers = (text: string): string[] => {
  const patterns: string[] = [];

  // Match repeating numbers like 111, 222, 11:11, etc.
  const matches = text.match(/\d+/g);
  if (matches) {
    patterns.push(...matches);
  }

  return patterns;
};

/**
 * Get readings by date range
 */
export const getReadingsByDateRange = (startDate: Date, endDate: Date): HistoricalReading[] => {
  const history = getReadingHistory();
  return history.filter(reading => {
    const readingDate = new Date(reading.timestamp);
    return readingDate >= startDate && readingDate <= endDate;
  });
};

/**
 * Get readings by type
 */
export const getReadingsByType = (type: HistoricalReading['inputType']): HistoricalReading[] => {
  const history = getReadingHistory();
  return history.filter(reading => reading.inputType === type);
};
