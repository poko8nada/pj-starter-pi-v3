import { describe, expect, it } from 'vitest';
import { formatCount } from './count.ts';

const THOUSAND = 1_000;
const MILLION = 1_000_000;

/** 期待値は en-US の書式で組み立てる。実装は 3 桁ごとのカンマを固定で入れる。 */
function grouped(value: number): string {
  return value.toLocaleString('en-US');
}

describe('formatCount', () => {
  it('0 と 999 と 1000 と 1000000 は区切り付きになる', () => {
    for (const value of [0, THOUSAND - 1, THOUSAND, MILLION]) {
      expect(formatCount(value)).toBe(grouped(value));
    }
  });

  it('負の値は符号が残る', () => {
    for (const value of [-THOUSAND, -MILLION]) {
      expect(formatCount(value)).toBe(grouped(value));
    }
  });
});
