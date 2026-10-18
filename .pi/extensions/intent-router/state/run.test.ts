import { describe, expect, it } from 'vitest';
import type { ClassifierCandidate } from '../settings/schema.ts';
import { defaultSettings } from '../settings/schema.ts';
import {
  addAction,
  arm,
  countJudgement,
  idleRun,
  noteTurn,
  noteVerdict,
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
  it('arm → armed で latest / earlier は空、数は 0', () => {
    const run = armed();
    expect(run.kind).toBe('armed');
    if (run.kind !== 'armed') {
      return;
    }
    expect(run.ownerNow).toBe('hello');
    expect(run.choice).toBe('reply');
    expect(run.latest).toEqual([]);
    expect(run.earlier).toEqual([]);
    expect(run.turns).toBe(0);
    expect(run.judgements).toBe(0);
    expect(run.streak).toBe(0);
    expect(run.nudges).toBe(0);
    expect(run.lastJudgedAt).toBeNull();
  });
});

describe('idle', () => {
  it('idle に addAction / noteTurn しても idle のまま', () => {
    expect(addAction(idleRun(), action(), limits()).kind).toBe('idle');
    expect(noteTurn(idleRun(), 'hi', limits()).kind).toBe('idle');
    expect(noteVerdict(idleRun(), true).kind).toBe('idle');
    expect(nudge(idleRun()).kind).toBe('idle');
  });
});

describe('addAction', () => {
  it('latest に足す', () => {
    let run = armed();
    run = addAction(run, action({ target: 'x.ts' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.latest).toHaveLength(1);
    expect(run.earlier).toHaveLength(0);
  });

  it('同じ read と同じ path を 2 回 → 1 件のままで attempts が 2', () => {
    let run = armed();
    run = addAction(run, action({ tool: 'read', target: 'x.ts', result: 'first' }), limits());
    run = addAction(run, action({ tool: 'read', target: 'x.ts', result: 'second' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.latest).toHaveLength(1);
    expect(run.latest[0]?.attempts).toBe(2);
    expect(run.latest[0]?.result).toBe('second');
  });

  it('.env を読んだ action が落ちる', () => {
    const run = addAction(armed(), action({ tool: 'read', target: '.env' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.latest).toHaveLength(0);
  });

  it('includeTools に無い道具は入らない', () => {
    const run = addAction(armed(), action({ tool: 'mystery', target: '' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.latest).toHaveLength(0);
  });
});

describe('noteTurn', () => {
  it('latest を earlier へ送ってから 1 往復と数える', () => {
    let run = armed();
    run = addAction(run, action({ target: 'x.ts' }), limits());
    run = noteTurn(run, 'assistant text', limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.latest).toEqual([]);
    expect(run.earlier).toHaveLength(1);
    expect(run.turns).toBe(1);
    expect(run.assistantLast).toBe('assistant text');
  });

  it('assistantLast が上限で切れる', () => {
    const run = noteTurn(armed(), 'あ'.repeat(501), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.assistantLast.length).toBe(500);
  });

  it('earlier が 12 件を超える → 古い物から落ちて truncated が立つ', () => {
    let run = armed();
    for (let index = 0; index < 13; index += 1) {
      run = addAction(run, action({ target: `f${index}.ts` }), limits());
      run = noteTurn(run, `text${index}`, limits());
    }
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.earlier).toHaveLength(12);
    expect(run.truncated).toBe(true);
    expect(run.earlier.map((item) => item.target)).not.toContain('f0.ts');
  });
});

describe('noteVerdict / nudge', () => {
  it('noteVerdict(true) で streak が増える', () => {
    let run = armed();
    run = noteVerdict(run, true);
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.streak).toBe(1);
    run = noteVerdict(run, true);
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.streak).toBe(2);
  });

  it('noteVerdict(false) で streak は 0 に戻る', () => {
    let run = armed();
    run = noteVerdict(run, true);
    run = noteVerdict(run, false);
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.streak).toBe(0);
  });

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
