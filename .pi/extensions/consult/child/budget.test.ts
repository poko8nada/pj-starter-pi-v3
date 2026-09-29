import { describe, expect, it } from 'vitest';
import { LAST_TURN_MESSAGE, lastTurn, turnsFrom } from './budget.ts';

// ここは「いつ促すか」だけを試す。子を実際に走らせるのは親の役目（consult の道具の検査が扱う）。

describe('lastTurn', () => {
  it('上限 40 → 39 番（0 から数えるので次が 40 番目）', () => {
    expect(lastTurn(40)).toBe(39);
  });

  it('上限 2 → 1 番（次が最後）', () => {
    expect(lastTurn(2)).toBe(1);
  });

  it('上限が無い・1 以下・数でない → 何もしない', () => {
    expect(lastTurn(undefined)).toBeUndefined();
    expect(lastTurn(1)).toBeUndefined();
    expect(lastTurn(0)).toBeUndefined();
    expect(lastTurn(Number.NaN)).toBeUndefined();
    expect(lastTurn(2.5)).toBeUndefined();
  });
});

describe('turnsFrom', () => {
  it('数の文字列 → その数', () => {
    expect(turnsFrom('40')).toBe(40);
  });

  it('空・数でない・0 以下 → undefined（促さない）', () => {
    expect(turnsFrom(undefined)).toBeUndefined();
    expect(turnsFrom('')).toBeUndefined();
    expect(turnsFrom('  ')).toBeUndefined();
    expect(turnsFrom('たくさん')).toBeUndefined();
    expect(turnsFrom('0')).toBeUndefined();
    expect(turnsFrom('-5')).toBeUndefined();
    expect(turnsFrom('2.5')).toBeUndefined();
  });
});

describe('LAST_TURN_MESSAGE', () => {
  it('チケットやサイクルの言葉を入れない（ロールの抽象を保つ）', () => {
    for (const word of ['チケット', 'サイクル', 'work', 'close']) {
      expect(LAST_TURN_MESSAGE).not.toContain(word);
    }
  });

  it('終えることを促す（報告を求める）', () => {
    expect(LAST_TURN_MESSAGE).toContain('報告');
  });
});
