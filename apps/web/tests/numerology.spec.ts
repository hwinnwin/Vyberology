import { describe, it, expect } from 'vitest';
import { generateReading } from '../src/lib/numerology';

describe('numerology', () => {
  it('computes Tùng sample', () => {
    const r = generateReading('Huynh Duc Tung Nguyen', '1988-05-25');
    // Based on actual calculation: lifePath=11, expression=9, soulUrge=4
    expect(r.numbers.lifePath.value).toBe(11);
    expect(r.numbers.expression.value).toBe(9);
    expect(r.numbers.soulUrge.value).toBe(4);
  });

  it('computes Max sample', () => {
    const r = generateReading('Wen Chay Lay', '1987-06-29');
    // Based on actual calculation: lifePath=6, expression=9, soulUrge=3
    expect(r.numbers.lifePath.value).toBe(6);
    expect(r.numbers.expression.value).toBe(9);
    expect(r.numbers.soulUrge.value).toBe(3);
  });
});
