import { describe, it, expect } from 'vitest';
import { extractNumbers } from './extract.js';

describe('extractNumbers', () => {
  it('should extract simple integers', () => {
    const result = extractNumbers('10 24 67 144');
    expect(result).toEqual([
      { value: 10, raw: '10', index: 0 },
      { value: 24, raw: '24', index: 1 },
      { value: 67, raw: '67', index: 2 },
      { value: 144, raw: '144', index: 3 },
    ]);
  });

  it('should extract numbers with special characters', () => {
    const result = extractNumbers('10:24 • 67% • 144 likes');
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ value: 10, raw: '10', index: 0 });
    expect(result[1]).toEqual({ value: 24, raw: '24', index: 1 });
  });

  it('should extract decimals', () => {
    const result = extractNumbers('Temperature: 98.6°F');
    expect(result).toEqual([
      { value: 98.6, raw: '98.6', index: 0 },
    ]);
  });

  it('should handle time formats', () => {
    const result = extractNumbers('11:11');
    expect(result).toEqual([
      { value: 11, raw: '11', index: 0 },
      { value: 11, raw: '11', index: 1 },
    ]);
  });

  it('should handle percentages', () => {
    const result = extractNumbers('Battery: 67%');
    expect(result).toEqual([
      { value: 67, raw: '67', index: 0 },
    ]);
  });

  it('should return empty array for no numbers', () => {
    const result = extractNumbers('No numbers here');
    expect(result).toEqual([]);
  });

  it('should handle master number patterns', () => {
    const result = extractNumbers('11 22 33');
    expect(result).toEqual([
      { value: 11, raw: '11', index: 0 },
      { value: 22, raw: '22', index: 1 },
      { value: 33, raw: '33', index: 2 },
    ]);
  });

  it('should extract numbers from complex Instagram screenshot', () => {
    const result = extractNumbers('10:24 • 67% • 144 likes • 333 views');
    expect(result).toHaveLength(5);
    expect(result.map(t => t.value)).toEqual([10, 24, 67, 144, 333]);
  });

  it('should handle large numbers', () => {
    const result = extractNumbers('1234567890');
    expect(result).toEqual([
      { value: 1234567890, raw: '1234567890', index: 0 },
    ]);
  });

  it('should preserve order', () => {
    const result = extractNumbers('third:3 first:1 second:2');
    expect(result.map(t => t.value)).toEqual([3, 1, 2]);
    expect(result.map(t => t.index)).toEqual([0, 1, 2]);
  });

  it('should handle empty string', () => {
    const result = extractNumbers('');
    expect(result).toEqual([]);
  });
});
