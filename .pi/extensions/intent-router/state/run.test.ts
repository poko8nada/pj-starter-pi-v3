import { describe, expect, it } from 'vitest';
import type { ClassifierCandidate } from '../settings/schema.ts';
import { defaultSettings } from '../settings/schema.ts';
import {
  addAction,
  arm,
  countJudgement,
  idleRun,
  noteTurn,
  nudge,
  type Action,
  type Run,
} from './run.ts';

const CANDIDATE: ClassifierCandidate = { provider: 'opencode', model: 'jev-1.13-free' };

function armed(): Run {
  return arm({ ownerNow: 'hello', choice: 'reply', confidence: 0.9, candidate: CANDIDATE, now: 1 });
}

function action(overrides: Partial<Action> = {}): Action {
  return {
    turn: 1,
    tool: 'read',
    target: 'x.ts',
    result: 'ok',
    attempts: 1,
    error: false,
    ...overrides,
  };
}

function limits() {
  return defaultSettings().state;
}

describe('arm', () => {
  it('arm → armed で read / related は空、数は 0', () => {
    const run = armed();
    expect(run.kind).toBe('armed');
    if (run.kind !== 'armed') {
      return;
    }
    expect(run.ownerNow).toBe('hello');
    expect(run.choice).toBe('reply');
    expect(run.read).toEqual([]);
    expect(run.related).toEqual([]);
    expect(run.turns).toBe(0);
    expect(run.judgements).toBe(0);
    expect(run.unrelated).toBe(0);
    expect(run.nudges).toBe(0);
    expect(run.lastJudgedAt).toBeNull();
  });
});

describe('idle', () => {
  it('idle に addAction / noteTurn しても idle のまま', () => {
    expect(addAction(idleRun(), action(), limits()).kind).toBe('idle');
    expect(noteTurn(idleRun(), 'hi', limits()).kind).toBe('idle');
    expect(nudge(idleRun()).kind).toBe('idle');
  });
});

describe('addAction', () => {
  it('read に足す', () => {
    let run = armed();
    run = addAction(run, action({ target: 'x.ts' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.read).toHaveLength(1);
    expect(run.related).toHaveLength(0);
  });

  it('同じ read と同じ path を 2 回 → 1 件のままで attempts が 2', () => {
    let run = armed();
    run = addAction(run, action({ tool: 'read', target: 'x.ts', result: 'first' }), limits());
    run = addAction(run, action({ tool: 'read', target: 'x.ts', result: 'second' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.read).toHaveLength(1);
    expect(run.read[0]?.attempts).toBe(2);
    expect(run.read[0]?.result).toBe('second');
  });

  it('.env を読んだ action が落ちる', () => {
    const run = addAction(armed(), action({ tool: 'read', target: '.env' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.read).toHaveLength(0);
  });

  it('includeTools に無い道具は入らない', () => {
    const run = addAction(armed(), action({ tool: 'mystery', target: '' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.read).toHaveLength(0);
  });

  it('既定の一覧の道具は通り、落ちた edit は通らない', () => {
    for (const tool of defaultSettings().state.includeTools) {
      const run = addAction(armed(), action({ tool, target: `${tool}-target` }), limits());
      if (run.kind !== 'armed') {
        throw new Error('must be armed');
      }
      expect(run.read).toHaveLength(1);
    }
    const dropped = addAction(armed(), action({ tool: 'edit', target: 'x.ts' }), limits());
    if (dropped.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(dropped.read).toHaveLength(0);
  });
});

describe('noteTurn', () => {
  it('read を related へ送ってから 1 往復と数える', () => {
    let run = armed();
    run = addAction(run, action({ target: 'x.ts' }), limits());
    run = noteTurn(run, 'assistant text', limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.read).toEqual([]);
    expect(run.related).toHaveLength(1);
    expect(run.turns).toBe(1);
    expect(run.assistantLast).toBe('assistant text');
  });

  it('assistantLast が上限で切れる', () => {
    const max = limits().assistantChars;
    const run = noteTurn(armed(), 'あ'.repeat(max + 1), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.assistantLast.length).toBe(max);
  });

  it('related が上限を超える → 古い物から落ちて truncated が立つ', () => {
    let run = armed();
    const max = limits().maxActions;
    for (let index = 0; index < max + 1; index += 1) {
      run = addAction(run, action({ target: `f${index}.ts` }), limits());
      run = noteTurn(run, `text${index}`, limits());
    }
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.related).toHaveLength(max);
    expect(run.truncated).toBe(true);
    expect(run.related.map((item) => item.target)).not.toContain('f0.ts');
  });
});

describe('nudge', () => {
  it('nudge で nudges が増える', () => {
    const run = nudge(armed());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.nudges).toBe(1);
  });

  it('countJudgement が judgements を増やし lastJudgedAt を入れる', () => {
    const run = countJudgement(armed(), 7);
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.judgements).toBe(1);
    expect(run.lastJudgedAt).toBe(7);
  });
});
