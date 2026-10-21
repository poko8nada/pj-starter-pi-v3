import { describe, expect, it } from 'vitest';
import { addFailure, addScrub, emptyStatus } from './cell.ts';

describe('cell', () => {
  it('既に使われた状態に addScrub(status, 3, 100) → removed が +3、lastAt が 100', () => {
    const status = { removed: 2, lastAt: 50, failures: 1 };
    expect(addScrub(status, 3, 100)).toEqual({ removed: 5, lastAt: 100, failures: 1 });
  });

  it('addScrub を 3 と 2 で 2 回 → removed が 5、lastAt が後の値', () => {
    const first = addScrub(emptyStatus(), 3, 10);
    const second = addScrub(first, 2, 20);
    expect(second.removed).toBe(5);
    expect(second.lastAt).toBe(20);
  });

  it('addFailure → failures が 1 増え、他が変わらない', () => {
    const status = { removed: 4, lastAt: 100, failures: 0 };
    expect(addFailure(status)).toEqual({ removed: 4, lastAt: 100, failures: 1 });
  });

  it('emptyStatus() → removed が 0、lastAt が null、failures が 0', () => {
    expect(emptyStatus()).toEqual({ removed: 0, lastAt: null, failures: 0 });
  });

  it('3 つのどれを呼んでも、渡した状態の値が変わらない', () => {
    const status = { removed: 1, lastAt: 10, failures: 2 };
    addScrub(status, 3, 100);
    addFailure(status);
    emptyStatus();
    expect(status).toEqual({ removed: 1, lastAt: 10, failures: 2 });
  });
});
