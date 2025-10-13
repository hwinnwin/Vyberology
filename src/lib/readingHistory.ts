// Reading History Management
// Stores and retrieves reading history from localStorage

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
 * Save a reading to history
 */
export const saveReading = (reading: Omit<HistoricalReading, 'id' | 'timestamp'>): void => {
  try {
    const history = getReadingHistory();
    const newReading: HistoricalReading = {
      ...reading,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    // Add to beginning of array (most recent first)
    history.unshift(newReading);

    // Limit history size
    if (history.length > MAX_HISTORY_ITEMS) {
      history.splice(MAX_HISTORY_ITEMS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save reading to history:', error);
  }
};

/**
 * Get all reading history
 */
export const getReadingHistory = (): HistoricalReading[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load reading history:', error);
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
