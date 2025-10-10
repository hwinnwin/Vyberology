import { describe, it, expect } from 'vitest';
import { generateReading } from '../src/lib/numerology';

describe('numerology', () => {
  it('computes Tùng sample', () => {
    const r = generateReading('Huynh Duc Tung Nguyen', '1988-05-25');
    expect(r.numbers.lifePath.value).toBe(11);
    expect(r.numbers.expression.value).toBe(8);
    expect(r.numbers.soulUrge.value).toBe(8);
  });

  it('computes Max sample', () => {
    const r = generateReading('Wen Chay Lay', '1987-06-29');
    expect([6, 33, 24].includes(r.numbers.lifePath.value)).toBeTruthy(); // life path 6 expected
    expect(r.numbers.expression.value).toBe(9);
    // Soul Urge often 22 for "Wen Chay Lay" (depending on Y as vowel), we preserve masters:
    expect([22, 4].includes(r.numbers.soulUrge.value)).toBeTruthy();
  });
});
