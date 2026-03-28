import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../readingHistory', () => ({
  getReadingHistory: vi.fn(() => []),
  getRecurringPatterns: vi.fn(() => []),
}));

vi.mock('../readingInsights', () => ({
  analyseReadingPatterns: vi.fn(() => ({
    totalReadings: 0,
    readingsThisWeek: 0,
    readingsThisMonth: 0,
    dominantNumbers: [],
    topPatterns: [],
    insights: [],
    contextSummary: 'No readings yet.',
    lastReadingAt: null,
    daysSinceLastReading: null,
  })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

import { buildLumynContext } from '../lumynContext';
import { getReadingHistory, getRecurringPatterns } from '../readingHistory';

describe('buildLumynContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns required inputs even with no history', async () => {
    const result = await buildLumynContext([], 'What is my life path?');

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'ReadingHistory' }),
        expect.objectContaining({ label: 'Conversation' }),
        expect.objectContaining({ label: 'Question', value: 'What is my life path?' }),
      ])
    );
  });

  it('includes ReadingHistory from localStorage', async () => {
    vi.mocked(getReadingHistory).mockReturnValue([
      {
        id: '1',
        timestamp: new Date().toISOString(),
        inputType: 'manual',
        inputValue: '111',
        reading: 'Your number 111 reveals a powerful energy awakening.',
      },
    ]);

    const result = await buildLumynContext([], 'Tell me more');

    const historyInput = result.find(i => i.label === 'ReadingHistory');
    expect(historyInput?.value).toContain('111');
    expect(historyInput?.value).toContain('manual');
  });

  it('includes conversation context', async () => {
    const messages = [
      { role: 'user' as const, content: 'What does 111 mean?' },
      { role: 'assistant' as const, content: 'The number 111 is a powerful sign...' },
    ];

    const result = await buildLumynContext(messages, 'Follow up question');

    const convoInput = result.find(i => i.label === 'Conversation');
    expect(convoInput?.value).toContain('User: What does 111 mean?');
    expect(convoInput?.value).toContain('Lumyn: The number 111');
  });

  it('includes RecurringPatterns when available', async () => {
    vi.mocked(getRecurringPatterns).mockReturnValue([
      { pattern: '111', count: 5 },
      { pattern: '222', count: 3 },
    ]);

    const result = await buildLumynContext([], 'Any patterns?');

    const patternsInput = result.find(i => i.label === 'RecurringPatterns');
    expect(patternsInput).toBeDefined();
    expect(patternsInput?.value).toContain('111');
    expect(patternsInput?.value).toContain('5x');
  });

  it('limits conversation to last 12 messages', async () => {
    const messages = Array.from({ length: 20 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}`,
    }));

    const result = await buildLumynContext(messages, 'Latest');

    const convoInput = result.find(i => i.label === 'Conversation');
    // Should include messages 8-19 (last 12)
    expect(convoInput?.value).toContain('Message 8');
    expect(convoInput?.value).not.toContain('Message 7');
  });

  it('limits reading history to last 8 readings', async () => {
    const readings = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      timestamp: new Date().toISOString(),
      inputType: 'manual' as const,
      inputValue: String(i * 100),
      reading: `Reading ${i}`,
    }));
    vi.mocked(getReadingHistory).mockReturnValue(readings);

    const result = await buildLumynContext([], 'Question');

    const historyInput = result.find(i => i.label === 'ReadingHistory');
    // Should not contain reading #8+ (0-indexed past the 8 limit)
    expect(historyInput?.value).toContain('Reading 0');
    expect(historyInput?.value).toContain('Reading 7');
    expect(historyInput?.value).not.toContain('Reading 8');
  });

  it('truncates message content to 600 chars', async () => {
    const longMessage = 'x'.repeat(1000);
    const messages = [{ role: 'user' as const, content: longMessage }];

    const result = await buildLumynContext(messages, 'Question');

    const convoInput = result.find(i => i.label === 'Conversation');
    // Each message content should be truncated to 600 chars max
    const userLine = convoInput?.value.split('\n').find(l => l.startsWith('User:'));
    expect(userLine!.length).toBeLessThanOrEqual(606); // "User: " + 600
  });
});
