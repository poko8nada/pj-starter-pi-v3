import { describe, expect, it } from 'vitest';
import type { TurnEndEventResult } from '@earendil-works/pi-coding-agent';
import budgetDefault, {
  LAST_TURN_MESSAGE,
  lastTurn,
  nudge,
  registerBudget,
  turnsFrom,
  type BudgetPiPort,
} from './budget.ts';

// ここは「いつ促すか」だけを試す。サブエージェントを実際に走らせるのはメインエージェントの役目（consult の道具の検査が扱う）。

function aBudgetPi(
  register: (pi: BudgetPiPort) => void,
): () => ((event: { turnIndex: number }) => TurnEndEventResult) | undefined {
  let handler: ((event: { turnIndex: number }) => TurnEndEventResult) | undefined;
  const pi = {
    on(_event: 'turn_end', next: (event: { turnIndex: number }) => TurnEndEventResult) {
      handler = next;
    },
  };
  register(pi);
  return () => handler;
}

describe('lastTurn', () => {
  it('有効な上限 → 上限-2 番（40→38、最小の2→0）', () => {
    expect(lastTurn(40)).toBe(38);
    expect(lastTurn(2)).toBe(0);
  });

  it('lastTurn: (boundary) 上限なし・1 → 何もしない', () => {
    expect(lastTurn(undefined)).toBeUndefined();
    expect(lastTurn(1)).toBeUndefined();
  });
});

describe('turnsFrom', () => {
  it('turnsFrom: (empty) 空・数でない・0 以下 → undefined', () => {
    expect(turnsFrom(undefined)).toBeUndefined();
    expect(turnsFrom('')).toBeUndefined();
    expect(turnsFrom('たくさん')).toBeUndefined();
    expect(turnsFrom('0')).toBeUndefined();
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

  it('一度出したら出さない（無条件の続行はループになる）', () => {
    const limit = 38;
    expect(nudge(limit, true, limit)).toBeUndefined();
  });
});

describe('registerBudget', () => {
  it('registerBudget: (happy) 促しの番号 → 1 度だけ促す', () => {
    const turns = 40;
    const limit = turns - 2;
    const getHandler = aBudgetPi((pi) => {
      registerBudget(pi, turns);
    });
    const first = getHandler()?.({ turnIndex: limit });
    expect(first).toEqual(nudge(limit, false, limit));
    const second = getHandler()?.({ turnIndex: limit });
    expect(second).toEqual({});
  });

  it('37 の後に 38 が来ても促す（37 は sent を消費しない）', () => {
    const turns = 40;
    const limit = turns - 2;
    const getHandler = aBudgetPi((pi) => {
      registerBudget(pi, turns);
    });
    expect(getHandler()?.({ turnIndex: limit - 1 })).toEqual({});
    const result = getHandler()?.({ turnIndex: limit });
    expect(result).toEqual(nudge(limit, false, limit));
  });
});

describe('budget: env から促しまで', () => {
  it('登録した命令は env を読む', () => {
    const turns = 40;
    const limit = turns - 2;
    const before = process.env.CONSULT_TURNS;
    process.env.CONSULT_TURNS = String(turns);
    try {
      const getHandler = aBudgetPi((pi) => {
        budgetDefault(pi);
      });
      const result = getHandler()?.({ turnIndex: limit });
      expect(result).toEqual(nudge(limit, false, limit));
    } finally {
      if (before === undefined) {
        delete process.env.CONSULT_TURNS;
      } else {
        process.env.CONSULT_TURNS = before;
      }
    }
  });
});
