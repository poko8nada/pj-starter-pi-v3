import { describe, expect, it } from 'vitest';
import { formatCount } from './count.ts';

describe('formatCount', () => {
  it('formatCount(1234) → 1,234', () => {
    expect(formatCount(1234)).toBe('1,234');
  });

  it('境界値 → 0 と 999 はそのまま、1000 から桁区切り', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(999)).toBe('999');
    expect(formatCount(1000)).toBe('1,000');
    expect(formatCount(1234567)).toBe('1,234,567');
  });
});
