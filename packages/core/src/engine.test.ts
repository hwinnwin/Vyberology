import { describe, it, expect } from 'vitest';
import { buildEngine } from './engine.js';
import type { ReadingInput } from '@vyberology/types';

describe('buildEngine', () => {
  it('should build complete reading from text input', () => {
    const input: ReadingInput = {
      sourceType: 'text',
      rawText: '10:24 • 67% • 144 likes',
      metadata: {
        context: 'Instagram screenshot',
        timestamp: '2025-11-21T10:24:00Z',
      },
    };

    const reading = buildEngine(input);

    expect(reading.tokens).toHaveLength(4);
    expect(reading.tokens[0].value).toBe(10);
    expect(reading.sums.reduced).toBe(3);
    expect(reading.elements.length).toBeGreaterThan(0);
    expect(reading.chakras.length).toBeGreaterThan(0);
    expect(reading.phase.volume).toBe(1);
    expect(reading.trace).toHaveProperty('sourceText');
    expect(reading.trace).toHaveProperty('extractedTokens');
  });

  it('should build reading from OCR text', () => {
    const input: ReadingInput = {
      sourceType: 'image',
      ocrText: '11:11 awakening',
    };

    const reading = buildEngine(input);

    expect(reading.tokens).toHaveLength(2);
    expect(reading.tokens[0].value).toBe(11);
    expect(reading.tokens[1].value).toBe(11);
    expect(reading.sums.fullSum).toBe(4);
    expect(reading.trace.sourceType).toBe('image');
  });

  it('should throw error for missing text', () => {
    const input: ReadingInput = {
      sourceType: 'text',
    };

    expect(() => buildEngine(input)).toThrow('No text provided');
  });

  it('should throw error for no numbers found', () => {
    const input: ReadingInput = {
      sourceType: 'text',
      rawText: 'No numbers here',
    };

    expect(() => buildEngine(input)).toThrow('No numbers found');
  });

  it('should include complete trace information', () => {
    const input: ReadingInput = {
      sourceType: 'text',
      rawText: '11 22 33',
      metadata: { context: 'master numbers' },
    };

    const reading = buildEngine(input);

    expect(reading.trace).toMatchObject({
      sourceText: '11 22 33',
      sourceType: 'text',
      extractedTokens: expect.any(Array),
      fullSumCalculation: expect.objectContaining({
        values: [11, 22, 33],
        fullSum: expect.any(Number),
        reduced: expect.any(Number),
      }),
      elementMapping: expect.objectContaining({
        context: 'master numbers',
        elements: expect.any(Array),
      }),
      chakraMapping: expect.objectContaining({
        context: 'master numbers',
        chakras: expect.any(Array),
      }),
      phaseAssignment: expect.objectContaining({
        volume: 1,
      }),
    });
  });

  it('should handle complex Instagram screenshot', () => {
    const input: ReadingInput = {
      sourceType: 'text',
      rawText: '10:24 • 67% • 144 likes • 333 views',
      metadata: { context: 'Instagram post screenshot' },
    };

    const reading = buildEngine(input);

    expect(reading.tokens).toHaveLength(5);
    expect(reading.tokens.map(t => t.value)).toEqual([10, 24, 67, 144, 333]);
    expect(reading.sums.reduced).toBeGreaterThan(0);
    expect(reading.elements).toContain('🜁 Air'); // time pattern
  });

  it('should handle master number 11:11', () => {
    const input: ReadingInput = {
      sourceType: 'text',
      rawText: '11:11',
    };

    const reading = buildEngine(input);

    expect(reading.tokens).toHaveLength(2);
    expect(reading.chakras).toContain('Crown'); // many 1s
  });

  it('should handle decimal numbers', () => {
    const input: ReadingInput = {
      sourceType: 'text',
      rawText: 'Temperature: 98.6°F',
    };

    const reading = buildEngine(input);

    expect(reading.tokens).toHaveLength(1);
    expect(reading.tokens[0].value).toBe(98.6);
  });

  it('should use context for element/chakra mapping', () => {
    const input: ReadingInput = {
      sourceType: 'text',
      rawText: '5',
      metadata: { context: 'spiritual awakening consciousness' },
    };

    const reading = buildEngine(input);

    expect(reading.chakras).toContain('Crown'); // context keyword
  });
});
