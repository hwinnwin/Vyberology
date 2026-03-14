import { describe, it, expect } from 'vitest';
import { cn, capitalizeName } from '../utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('merges tailwind conflicts correctly', () => {
    // twMerge should keep the last conflicting class
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });

  it('handles object syntax', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });
});

describe('capitalizeName', () => {
  it('capitalizes single word', () => {
    expect(capitalizeName('john')).toBe('John');
  });

  it('capitalizes multiple words', () => {
    expect(capitalizeName('john doe')).toBe('John Doe');
  });

  it('handles already capitalized names', () => {
    expect(capitalizeName('JOHN DOE')).toBe('John Doe');
  });

  it('handles mixed case', () => {
    expect(capitalizeName('jOhN dOe')).toBe('John Doe');
  });

  it('handles three-word names', () => {
    expect(capitalizeName('mary jane watson')).toBe('Mary Jane Watson');
  });

  it('handles empty string', () => {
    expect(capitalizeName('')).toBe('');
  });
});
