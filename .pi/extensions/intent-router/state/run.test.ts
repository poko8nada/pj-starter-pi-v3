import { describe, expect, it } from 'vitest';
import type { ClassifierCandidate } from '../settings/schema.ts';
import { defaultSettings } from '../settings/schema.ts';
import { isSecretTarget } from './payload.ts';
import {
  addAction,
  arm,
  countJudgement,
  fire,
  idleRun,
  noteTurn,
  type Action,
  type Run,
} from './run.ts';

const CANDIDATE: ClassifierCandidate = { provider: 'opencode', model: 'jev-1.13-free' };

function armed(): Run {
  return arm({ prompt: 'hello', label: 'question', confidence: 0.9, candidate: CANDIDATE, now: 1 });
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
  it('arm → armed で空の記録と 0 の数、lastJudgedAt は null', () => {
    const run = arm({
      prompt: 'hello',
      label: 'question',
      confidence: 0.9,
      candidate: CANDIDATE,
      now: 1,
    });
    expect(run.kind).toBe('armed');
    if (run.kind !== 'armed') {
      return;
    }
    expect(run.actions).toEqual([]);
    expect(run.turns).toBe(0);
    expect(run.judgements).toBe(0);
    expect(run.fires).toBe(0);
    expect(run.lastJudgedAt).toBeNull();
  });
});

describe('idle', () => {
  it('idle に addAction / noteTurn しても idle のまま', () => {
    expect(addAction(idleRun(), action(), limits()).kind).toBe('idle');
    expect(noteTurn(idleRun(), 'hi', limits()).kind).toBe('idle');
  });
});

describe('addAction', () => {
  it('12 回 → 12 件で truncated は false、13 回目で true', () => {
    let run = armed();
    for (let index = 0; index < 12; index += 1) {
      run = addAction(run, action({ target: `f${index}.ts` }), limits());
    }
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.actions).toHaveLength(12);
    expect(run.truncated).toBe(false);
    run = addAction(run, action({ target: 'overflow.ts' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.actions).toHaveLength(12);
    expect(run.truncated).toBe(true);
    expect(run.actions.map((item) => item.target)).not.toContain('f0.ts');
    expect(run.actions.map((item) => item.target)).toContain('overflow.ts');
  });

  it('同じ read と同じ path を 2 回 → 1 件のままで attempts が 2', () => {
    let run = armed();
    run = addAction(run, action({ tool: 'read', target: 'x.ts', result: 'first' }), limits());
    run = addAction(run, action({ tool: 'read', target: 'x.ts', result: 'second' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.actions).toHaveLength(1);
    expect(run.actions[0]?.attempts).toBe(2);
    expect(run.actions[0]?.result).toBe('second');
  });

  it('.env を読んだ action が落ちる', () => {
    expect(isSecretTarget('.env')).toBe(true);
    const run = addAction(armed(), action({ tool: 'read', target: '.env' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.actions).toHaveLength(0);
  });

  it('秘密の的（~/.pi の下・鍵の名前・鍵の拡張子）を弾き、ふつうの的は通す', () => {
    expect(isSecretTarget('~/.pi/config.json')).toBe(true);
    expect(isSecretTarget('/home/owner/.ssh/id_rsa')).toBe(true);
    expect(isSecretTarget('id_ed25519')).toBe(true);
    expect(isSecretTarget('certs/server.pem')).toBe(true);
    expect(isSecretTarget('certs/server.key')).toBe(true);
    expect(isSecretTarget('x.ts')).toBe(false);
    expect(isSecretTarget('')).toBe(false);
    let run = armed();
    run = addAction(run, action({ tool: 'read', target: '~/.pi/config.json' }), limits());
    run = addAction(run, action({ tool: 'read', target: 'x.ts' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.actions.map((item) => item.target)).toEqual(['x.ts']);
  });

  it('includeTools に無い道具は入らない', () => {
    const run = addAction(armed(), action({ tool: 'mystery', target: '' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.actions).toHaveLength(0);
  });
});

describe('noteTurn / countJudgement / fire', () => {
  it('noteTurn で assistantLast が 500 字に切れる', () => {
    const run = noteTurn(armed(), 'あ'.repeat(501), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.assistantLast.length).toBe(500);
  });

  it('countJudgement が judgements を増やし lastJudgedAt を入れる', () => {
    const run = countJudgement(armed(), 7);
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.judgements).toBe(1);
    expect(run.lastJudgedAt).toBe(7);
  });

  it('fire が fires を増やす', () => {
    const run = fire(armed());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.fires).toBe(1);
  });
});
