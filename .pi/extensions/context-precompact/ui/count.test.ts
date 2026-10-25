import { describe, expect, it } from 'vitest';
import { formatCount } from './count.ts';

const THOUSAND = 1_000;
const MILLION = 1_000_000;

describe('formatCount', () => {
  it('0、999、1000、1000000 → 区切り付き', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(THOUSAND - 1)).toBe('999');
    expect(formatCount(THOUSAND)).toBe('1,000');
    expect(formatCount(MILLION)).toBe('1,000,000');
  });

  it('負の値 → 符号が残る', () => {
    expect(formatCount(-THOUSAND)).toBe('-1,000');
    expect(formatCount(-MILLION)).toBe('-1,000,000');
  });
});
