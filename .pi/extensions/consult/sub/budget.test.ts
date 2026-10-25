import { describe, expect, it } from 'vitest';
import type { TurnEndEventResult } from '@earendil-works/pi-coding-agent';
import budgetDefault, {
  LAST_TURN_MESSAGE,
  lastTurn,
  nudge,
  registerBudget,
  turnsFrom,
} from './budget.ts';

// ここは「いつ促すか」だけを試す。サブエージェントを実際に走らせるのはメインエージェントの役目（consult の道具の検査が扱う）。

describe('lastTurn', () => {
  it('上限 40 → 38 番（促しの後に 1 ターン残る）', () => {
    const turns = 40;
    expect(lastTurn(turns)).toBe(turns - 2);
  });

  it('上限 2 → 0 番', () => {
    const turns = 2;
    expect(lastTurn(turns)).toBe(turns - 2);
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
    const text = '40';
    expect(turnsFrom(text)).toBe(Number(text));
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
    const limit = 38;
    const result = nudge(limit, false, limit);
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
    const limit = 38;
    expect(nudge(limit, false, limit - 1)).toBeUndefined();
  });

  it('一度出したら出さない（無条件の続行はループになる）', () => {
    const limit = 38;
    expect(nudge(limit, true, limit)).toBeUndefined();
  });

  it('上限が読めない → 何もしない（促さず、pi の打ち切りに任せる）', () => {
    expect(nudge(undefined, false, 999)).toBeUndefined();
  });
});

describe('registerBudget', () => {
  it('促しの番号で 1 度だけ促す（2 度目の turn_end では出さない）', () => {
    const turns = 40;
    const limit = turns - 2;
    let handler: ((event: { turnIndex: number }) => TurnEndEventResult) | undefined;
    const pi = {
      on(_event: 'turn_end', next: (event: { turnIndex: number }) => TurnEndEventResult) {
        handler = next;
      },
    };
    registerBudget(pi, turns);
    const first = handler?.({ turnIndex: limit });
    expect(first && 'continue' in first ? first.continue : undefined).toBe(true);
    expect(first && 'entries' in first ? first.entries : undefined).toHaveLength(1);
    expect(first && 'entries' in first ? first.entries?.[0] : undefined).toMatchObject({
      type: 'custom_message',
      customType: 'consult-budget',
      content: LAST_TURN_MESSAGE,
      display: true,
    });
    const second = handler?.({ turnIndex: limit });
    expect(second).toEqual({});
  });

  it('37 の後に 38 が来ても促す（37 は sent を消費しない）', () => {
    const turns = 40;
    const limit = turns - 2;
    let handler: ((event: { turnIndex: number }) => TurnEndEventResult) | undefined;
    const pi = {
      on(_event: 'turn_end', next: (event: { turnIndex: number }) => TurnEndEventResult) {
        handler = next;
      },
    };
    registerBudget(pi, turns);
    expect(handler?.({ turnIndex: limit - 1 })).toEqual({});
    const result = handler?.({ turnIndex: limit });
    expect(result && 'continue' in result ? result.continue : undefined).toBe(true);
    expect(result && 'entries' in result ? result.entries : undefined).toHaveLength(1);
  });
});

describe('budget: env から促しまで', () => {
  it('登録した命令は env を読む', () => {
    const turns = 40;
    const limit = turns - 2;
    const before = process.env.CONSULT_TURNS;
    process.env.CONSULT_TURNS = String(turns);
    try {
      let handler: ((event: { turnIndex: number }) => TurnEndEventResult) | undefined;
      const pi = {
        on(_event: 'turn_end', next: (event: { turnIndex: number }) => TurnEndEventResult) {
          handler = next;
        },
      };
      budgetDefault(pi);
      const result = handler?.({ turnIndex: limit });
      expect(result && 'continue' in result ? result.continue : undefined).toBe(true);
      expect(result && 'entries' in result ? result.entries : undefined).toHaveLength(1);
    } finally {
      if (before === undefined) {
        delete process.env.CONSULT_TURNS;
      } else {
        process.env.CONSULT_TURNS = before;
      }
    }
  });
});
