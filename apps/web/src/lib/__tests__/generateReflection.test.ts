import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../vybeApi', () => ({
  callVybeReading: vi.fn(),
}));

import { generateReflection } from '../generateReflection';
import { callVybeReading } from '../vybeApi';

describe('generateReflection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls callVybeReading with correct parameters', async () => {
    vi.mocked(callVybeReading).mockResolvedValue('A meaningful reflection sentence here.');

    await generateReflection('111', 'Your life path reveals deep wisdom.');

    expect(callVybeReading).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ label: 'CapturedValue', value: '111' }),
        expect.objectContaining({ label: 'ReadingExcerpt' }),
        expect.objectContaining({ label: 'ReflectionInstruction' }),
      ]),
      'lite'
    );
  });

  it('returns cleaned text stripping markdown', async () => {
    vi.mocked(callVybeReading).mockResolvedValue(
      '## Heading\n**Bold**\n- short\nA meaningful reflection about your energy.'
    );

    const result = await generateReflection('111', 'Test reading');
    expect(result).toBe('A meaningful reflection about your energy.');
    expect(result).not.toContain('##');
    expect(result).not.toContain('**');
  });

  it('returns null on failure', async () => {
    vi.mocked(callVybeReading).mockRejectedValue(new Error('Network error'));

    const result = await generateReflection('111', 'Test reading');
    expect(result).toBeNull();
  });

  it('returns null when no valid lines remain', async () => {
    vi.mocked(callVybeReading).mockResolvedValue('## Title\n- x\n');

    const result = await generateReflection('111', 'Test reading');
    expect(result).toBeNull();
  });

  it('truncates readingExcerpt to 600 chars', async () => {
    const longExcerpt = 'x'.repeat(1000);
    vi.mocked(callVybeReading).mockResolvedValue('Short reflection sentence here for test.');

    await generateReflection('111', longExcerpt);

    const call = vi.mocked(callVybeReading).mock.calls[0];
    const excerptInput = call[0].find(i => i.label === 'ReadingExcerpt');
    expect(excerptInput!.value.length).toBeLessThanOrEqual(600);
  });

  it('replaces newlines in excerpt', async () => {
    vi.mocked(callVybeReading).mockResolvedValue('Reflection about your journey here now.');

    await generateReflection('111', 'Line one\n\n\nLine two');

    const call = vi.mocked(callVybeReading).mock.calls[0];
    const excerptInput = call[0].find(i => i.label === 'ReadingExcerpt');
    expect(excerptInput!.value).toBe('Line one Line two');
  });
});
