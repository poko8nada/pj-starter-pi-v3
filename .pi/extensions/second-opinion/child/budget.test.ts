import { describe, expect, it } from 'vitest';
import type { TurnEndEventResult } from '@earendil-works/pi-coding-agent';
import budgetDefault, {
  LAST_TURN_MESSAGE,
  lastTurn,
  nudge,
  registerBudget,
  turnsFrom,
} from './budget.ts';

// ここは「いつ促すか」だけを試す。子を実際に走らせるのは親の役目（opinion の道具の検査が扱う）。

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

/** default export 用: env を差し替えて登録し、指定の turnIndex を起こす */
function fireDefaultWith(
  envValue: string | undefined,
  turnIndex: number,
): TurnEndEventResult | undefined {
  const saved = process.env.CONSULT_TURNS;
  try {
    if (envValue === undefined) {
      delete process.env.CONSULT_TURNS;
    } else {
      process.env.CONSULT_TURNS = envValue;
    }
    let handler: ((event: { turnIndex: number }) => TurnEndEventResult) | undefined;
    const pi = {
      on(_event: 'turn_end', next: (event: { turnIndex: number }) => TurnEndEventResult) {
        handler = next;
      },
    };
    budgetDefault(pi);
    return handler?.({ turnIndex });
  } finally {
    if (saved === undefined) {
      delete process.env.CONSULT_TURNS;
    } else {
      process.env.CONSULT_TURNS = saved;
    }
  }
}

describe('lastTurn', () => {
  it('上限 20 → 18 番（促しの後に 1 ターン残る）', () => {
    expect(lastTurn(20)).toBe(18);
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
    expect(turnsFrom('20')).toBe(20);
  });

  it('空・数でない・0 以下 → undefined（促さない）', () => {
    expect(turnsFrom(undefined)).toBeUndefined();
    expect(turnsFrom('')).toBeUndefined();
    expect(turnsFrom('  ')).toBeUndefined();
    expect(turnsFrom('x')).toBeUndefined();
    expect(turnsFrom('0')).toBeUndefined();
    expect(turnsFrom('-5')).toBeUndefined();
    expect(turnsFrom('2.5')).toBeUndefined();
  });
});

describe('nudge', () => {
  it('促しの番号 → custom_message を 1 つ提案し、1 ターン続ける', () => {
    const result = nudge(18, false, 18);
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
    expect(nudge(18, false, 17)).toBeUndefined();
  });

  it('一度出したら出さない（無条件の続行はループになる）', () => {
    expect(nudge(18, true, 18)).toBeUndefined();
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
    registerBudget(pi, 20);
    const first = handler?.({ turnIndex: 18 });
    expect(first && 'continue' in first ? first.continue : undefined).toBe(true);
    expect(first && 'entries' in first ? first.entries : undefined).toHaveLength(1);
    expect(first && 'entries' in first ? first.entries?.[0] : undefined).toMatchObject({
      type: 'custom_message',
      customType: 'consult-budget',
      content: LAST_TURN_MESSAGE,
      display: true,
    });
    const second = handler?.({ turnIndex: 18 });
    expect(second).toEqual({});
  });

  it('17 の後に 18 が来ても促す（17 は sent を消費しない）', () => {
    let handler: ((event: { turnIndex: number }) => TurnEndEventResult) | undefined;
    const pi = {
      on(_event: 'turn_end', next: (event: { turnIndex: number }) => TurnEndEventResult) {
        handler = next;
      },
    };
    registerBudget(pi, 20);
    expect(handler?.({ turnIndex: 17 })).toEqual({});
    const result = handler?.({ turnIndex: 18 });
    expect(result && 'continue' in result ? result.continue : undefined).toBe(true);
    expect(result && 'entries' in result ? result.entries : undefined).toHaveLength(1);
  });
});

describe('default export', () => {
  it("'20' → 18 で促す（env から登録までの配線）", () => {
    const result = fireDefaultWith('20', 18);
    expect(result && 'continue' in result ? result.continue : undefined).toBe(true);
    expect(result && 'entries' in result ? result.entries : undefined).toHaveLength(1);
  });

  it('未設定・不正 → 促しは出ない', () => {
    expect(fireDefaultWith(undefined, 18)).toEqual({});
    expect(fireDefaultWith('', 18)).toEqual({});
    expect(fireDefaultWith('x', 18)).toEqual({});
  });
});

describe('budget: env から促しまで', () => {
  it("env '20' → 18 で促す（env から促しまでの 1 本）", () => {
    const turns = turnsFrom('20');
    expect(lastTurn(turns)).toBe(18);
    const result = fireWith(turns, 18);
    expect(result && 'continue' in result ? result.continue : undefined).toBe(true);
    expect(result && 'entries' in result ? result.entries : undefined).toHaveLength(1);
  });

  it('同じ並びで 17 → 促しは出ない', () => {
    expect(fireWith(turnsFrom('20'), 17)).toEqual({});
  });

  it('上限が読めない → 促しは出ない', () => {
    expect(fireWith(turnsFrom(''), 18)).toEqual({});
    expect(fireWith(turnsFrom('x'), 18)).toEqual({});
    expect(fireWith(turnsFrom(undefined), 18)).toEqual({});
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
