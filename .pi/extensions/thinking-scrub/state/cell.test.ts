import { describe, expect, it } from 'vitest';
import { addFailure, addScrub, addTally, emptyStatus, emptyTally } from './cell.ts';

describe('cell', () => {
  it('使われた状態に addScrub → removed が増え、lastAt がその値', () => {
    const status = { removed: 2, lastAt: 50, failures: 1 };
    const added = 3;
    const at = 100;
    expect(addScrub(status, added, at)).toEqual({
      removed: status.removed + added,
      lastAt: at,
      failures: status.failures,
    });
  });

  it('addFailure → failures が 1 増え、他が変わらない', () => {
    const status = { removed: 4, lastAt: 100, failures: 0 };
    expect(addFailure(status)).toEqual({
      removed: status.removed,
      lastAt: status.lastAt,
      failures: status.failures + 1,
    });
  });

  it('emptyStatus() → removed が 0、lastAt が null、failures が 0', () => {
    expect(emptyStatus()).toEqual({ removed: 0, lastAt: null, failures: 0 });
  });

  it('emptyTally() → runs が 0、chars が 0', () => {
    expect(emptyTally()).toEqual({ runs: 0, chars: 0 });
  });

  it('3 つのどれを呼んでも、渡した状態の値が変わらない', () => {
    const status = { removed: 1, lastAt: 10, failures: 2 };
    const snapshot = { ...status };
    addScrub(status, 3, 100);
    addFailure(status);
    emptyStatus();
    expect(status).toEqual(snapshot);
  });

  it('addTally を 2 回 → 合計になり、渡した値は変わらない', () => {
    const first = emptyTally();
    const firstRuns = 1;
    const firstChars = 26;
    const second = addTally(first, firstRuns, firstChars);
    expect(first).toEqual(emptyTally());
    const third = addTally(second, firstRuns, firstChars);
    expect(second).toEqual({ runs: firstRuns, chars: firstChars });
    expect(third).toEqual({ runs: firstRuns * 2, chars: firstChars * 2 });
  });
});
