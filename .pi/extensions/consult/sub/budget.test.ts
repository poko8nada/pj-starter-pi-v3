import { describe, expect, it } from 'vitest';
import type { TurnEndEventResult } from '@earendil-works/pi-coding-agent';
import { LAST_TURN_MESSAGE, lastTurn, nudge, registerBudget, turnsFrom } from './budget.ts';

// ここは「いつ促すか」だけを試す。子を実際に走らせるのは親の役目（consult の道具の検査が扱う）。

/** 偽 pi に登録し、指定の turnIndex で turn_end を起こす */
function fireWith(turns: number | undefined, turnIndex: number): TurnEndEventResult | undefined {
  let handler: ((event: { turnIndex: number }) => TurnEndEventResult) | undefined;
  const pi = {
    on(_event: 'turn_end', next: (event: { turnIndex: number }) => TurnEndEventResult) {
      handler = next;
    },
  };
  registerBudget(pi, turns);
  return handler?.({ turnIndex });
}

describe('lastTurn', () => {
  it('上限 40 → 38 番（促しの後に 1 ターン残る）', () => {
    expect(lastTurn(40)).toBe(38);
  });

  it('上限 2 → 0 番', () => {
    expect(lastTurn(2)).toBe(0);
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

describe('nudge', () => {
  it('促しの番号 → custom_message を 1 つ提案し、1 ターン続ける', () => {
    const result = nudge(38, false, 38);
    expect(result?.continue).toBe(true);
    expect(result?.entries).toHaveLength(1);
    expect(result?.entries?.[0]).toMatchObject({
      type: 'custom_message',
      customType: 'consult-budget',
      content: LAST_TURN_MESSAGE,
      display: true,
    });
  });

  it('促しの 1 つ手前 → 何もしない（ターンを消費しない）', () => {
    expect(nudge(38, false, 37)).toBeUndefined();
  });

  it('一度出したら出さない（無条件の続行はループになる）', () => {
    expect(nudge(38, true, 38)).toBeUndefined();
  });

  it('上限が読めない → 何もしない（促さず、pi の打ち切りに任せる）', () => {
    expect(nudge(undefined, false, 999)).toBeUndefined();
  });
});

describe('registerBudget', () => {
  it('促しの番号で 1 度だけ促す（2 度目の turn_end では出さない）', () => {
    let handler: ((event: { turnIndex: number }) => TurnEndEventResult) | undefined;
    const pi = {
      on(_event: 'turn_end', next: (event: { turnIndex: number }) => TurnEndEventResult) {
        handler = next;
      },
    };
    registerBudget(pi, 40);
    const first = handler?.({ turnIndex: 38 });
    expect(first && 'continue' in first ? first.continue : undefined).toBe(true);
    expect(first && 'entries' in first ? first.entries : undefined).toHaveLength(1);
    expect(first && 'entries' in first ? first.entries?.[0] : undefined).toMatchObject({
      type: 'custom_message',
      customType: 'consult-budget',
      content: LAST_TURN_MESSAGE,
      display: true,
    });
    const second = handler?.({ turnIndex: 38 });
    expect(second).toEqual({});
  });

  it('37 の後に 38 が来ても促す（37 は sent を消費しない）', () => {
    let handler: ((event: { turnIndex: number }) => TurnEndEventResult) | undefined;
    const pi = {
      on(_event: 'turn_end', next: (event: { turnIndex: number }) => TurnEndEventResult) {
        handler = next;
      },
    };
    registerBudget(pi, 40);
    expect(handler?.({ turnIndex: 37 })).toEqual({});
    const result = handler?.({ turnIndex: 38 });
    expect(result && 'continue' in result ? result.continue : undefined).toBe(true);
    expect(result && 'entries' in result ? result.entries : undefined).toHaveLength(1);
  });
});

describe('budget: env から促しまで', () => {
  it("env '40' → 38 で促す（env から促しまでの 1 本）", () => {
    const turns = turnsFrom('40');
    expect(lastTurn(turns)).toBe(38);
    const result = fireWith(turns, 38);
    expect(result && 'continue' in result ? result.continue : undefined).toBe(true);
    expect(result && 'entries' in result ? result.entries : undefined).toHaveLength(1);
  });

  it('同じ並びで 37 → 促しは出ない', () => {
    expect(fireWith(turnsFrom('40'), 37)).toEqual({});
  });

  it('上限が読めない → 促しは出ない', () => {
    expect(fireWith(turnsFrom(''), 38)).toEqual({});
    expect(fireWith(turnsFrom('x'), 38)).toEqual({});
    expect(fireWith(turnsFrom(undefined), 38)).toEqual({});
  });
});
