import { describe, expect, it } from 'vitest';
import { formatCount } from './count.ts';

const THOUSAND = 1_000;
const MILLION = 1_000_000;

/** 区切りの仕様はプラットフォームの書式から取る */
function grouped(value: number): string {
  return value.toLocaleString('en-US');
}

describe('formatCount', () => {
  it('0、999、1000、1000000 → 区切り付き', () => {
    for (const value of [0, THOUSAND - 1, THOUSAND, MILLION]) {
      expect(formatCount(value)).toBe(grouped(value));
    }
  });

  it('負の値 → 符号が残る', () => {
    for (const value of [-THOUSAND, -MILLION]) {
      expect(formatCount(value)).toBe(grouped(value));
    }
  });
});
