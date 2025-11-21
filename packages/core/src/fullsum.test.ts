import { describe, it, expect } from 'vitest';
import { fullSum } from './fullsum.js';

describe('fullSum', () => {
  it('should sum digits and reduce to single digit', () => {
    const result = fullSum([10, 24, 67, 144]);
    // Concatenate: 1024671144
    // Sum: 1+0+2+4+6+7+1+1+4+4 = 30
    // Reduce: 3+0 = 3
    expect(result).toEqual({
      fullSum: 30,
      reduced: 3,
    });
  });

  it('should preserve master number 11', () => {
    const result = fullSum([9, 2]);
    // Concatenate: 92
    // Sum: 9+2 = 11 (master!)
    expect(result).toEqual({
      fullSum: 11,
      reduced: 11,
      master: 11,
    });
  });

  it('should preserve master number 22', () => {
    const result = fullSum([1, 3, 8]);
    // Concatenate: 138
    // Sum: 1+3+8 = 12
    // Reduce: 1+2 = 3
    expect(result.fullSum).toBe(12);
    expect(result.reduced).toBe(3);
  });

  it('should find master 22 in reduction', () => {
    const result = fullSum([5, 8, 9]);
    // Concatenate: 589
    // Sum: 5+8+9 = 22 (master!)
    expect(result).toEqual({
      fullSum: 22,
      reduced: 22,
      master: 22,
    });
  });

  it('should preserve master number 33', () => {
    const result = fullSum([1, 5, 9, 9]);
    // Concatenate: 1599
    // Sum: 1+5+9+9 = 24
    // Reduce: 2+4 = 6
    expect(result.fullSum).toBe(24);
    expect(result.reduced).toBe(6);
  });

  it('should find master 33 in sum', () => {
    const result = fullSum([6, 9, 9, 9]);
    // Concatenate: 6999
    // Sum: 6+9+9+9 = 33 (master!)
    expect(result).toEqual({
      fullSum: 33,
      reduced: 33,
      master: 33,
    });
  });

  it('should reduce multi-digit non-master numbers', () => {
    const result = fullSum([1, 2, 3, 4, 5]);
    // Concatenate: 12345
    // Sum: 1+2+3+4+5 = 15
    // Reduce: 1+5 = 6
    expect(result).toEqual({
      fullSum: 15,
      reduced: 6,
    });
  });

  it('should handle single-digit sums', () => {
    const result = fullSum([1, 1, 1]);
    // Concatenate: 111
    // Sum: 1+1+1 = 3
    expect(result).toEqual({
      fullSum: 3,
      reduced: 3,
    });
  });

  it('should handle empty array', () => {
    const result = fullSum([]);
    expect(result).toEqual({
      fullSum: 0,
      reduced: 0,
    });
  });

  it('should handle single number', () => {
    const result = fullSum([144]);
    // Concatenate: 144
    // Sum: 1+4+4 = 9
    expect(result).toEqual({
      fullSum: 9,
      reduced: 9,
    });
  });

  it('should handle mirror time 11:11', () => {
    const result = fullSum([11, 11]);
    // Concatenate: 1111
    // Sum: 1+1+1+1 = 4
    expect(result).toEqual({
      fullSum: 4,
      reduced: 4,
    });
  });

  it('should handle large numbers correctly', () => {
    const result = fullSum([333, 444, 555]);
    // Concatenate: 333444555
    // Sum: 3+3+3+4+4+4+5+5+5 = 36
    // Reduce: 3+6 = 9
    expect(result).toEqual({
      fullSum: 36,
      reduced: 9,
    });
  });

  it('should ignore decimal parts (floor values)', () => {
    const result = fullSum([3.14, 2.71]);
    // Floors to [3, 2]
    // Concatenate: 32
    // Sum: 3+2 = 5
    expect(result).toEqual({
      fullSum: 5,
      reduced: 5,
    });
  });

  it('should handle negative numbers as positive', () => {
    const result = fullSum([-11, -22]);
    // Absolute values: 11, 22
    // Concatenate: 1122
    // Sum: 1+1+2+2 = 6
    expect(result).toEqual({
      fullSum: 6,
      reduced: 6,
    });
  });
});
