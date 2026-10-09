import { describe, expect, it } from 'vitest';
import type { ClassifierCandidate } from './settings.ts';
import { defaultSettings } from './settings.ts';
import {
  addAction,
  arm,
  asInput,
  countJudgement,
  fire,
  idleRun,
  isSecretTarget,
  judgeState,
  noteTurn,
  routeState,
  targetOf,
  toAction,
  type Action,
  type Run,
} from './state.ts';

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
    expect(noteTurn(idleRun(), 'hi', limits(), 2).kind).toBe('idle');
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
  });

  it('同じ read と同じ path を 2 回 → 1 件のままで attempts が 2', () => {
    let run = armed();
    run = addAction(run, action({ tool: 'read', target: 'x.ts' }), limits());
    run = addAction(run, action({ tool: 'read', target: 'x.ts' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.actions).toHaveLength(1);
    expect(run.actions[0]?.attempts).toBe(2);
  });

  it('.env を読んだ action が落ちる', () => {
    expect(isSecretTarget('.env')).toBe(true);
    const run = addAction(armed(), action({ tool: 'read', target: '.env' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.actions).toHaveLength(0);
  });

  it('includeTools に無い道具は入らない', () => {
    const run = addAction(armed(), action({ tool: 'mystery', target: '' }), limits());
    if (run.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(run.actions).toHaveLength(0);
  });
});

describe('toAction', () => {
  it('result が上限で切れる（上限は設定から来る）', () => {
    const cut = toAction(1, 'read', { path: 'x.ts' }, 'あ'.repeat(301), false, 300);
    expect(cut.result.length).toBe(300);
    const kept = toAction(1, 'read', { path: 'x.ts' }, 'あ'.repeat(301), false, 10000);
    expect(kept.result.length).toBe(301);
  });

  it('error が true の時、result が error: で始まる', () => {
    expect(
      toAction(1, 'read', { path: 'x.ts' }, 'boom', true, 300).result.startsWith('error: '),
    ).toBe(true);
  });
});

describe('targetOf', () => {
  it('道具ごとの的を抜く（未知道具は空）', () => {
    expect(targetOf('read', { path: 'x.ts' })).toBe('x.ts');
    expect(targetOf('grep', { pattern: 'a|b' })).toBe('a|b');
    expect(targetOf('bash', { command: 'pnpm test --run' })).toBe('pnpm');
    expect(targetOf('consult_run', { role: 'review' })).toBe('review');
    expect(targetOf('web_search', { query: 'x' })).toBe('x');
    expect(targetOf('mystery', {})).toBe('');
  });

  it('asInput が記録以外を {} にする', () => {
    expect(asInput({ path: 'x.ts' })).toEqual({ path: 'x.ts' });
    expect(asInput('x.ts')).toEqual({});
  });
});

describe('noteTurn / countJudgement / fire', () => {
  it('noteTurn で assistantLast が 500 字に切れる', () => {
    const run = noteTurn(armed(), 'あ'.repeat(501), limits(), 2);
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

describe('routeState', () => {
  it('owner_prompt が 2000 字までで、has_images が真偽だけ', () => {
    const state = routeState('a\nb', 'repo', true);
    expect(state['owner_prompt']).toBe('a\nb');
    expect(state['has_images']).toBe(true);
    const long = routeState('a'.repeat(2500), 'repo', false);
    expect(String(long['owner_prompt']).length).toBe(2000);
  });
});

describe('judgeState', () => {
  it('画像・base64 の文字列を含まない', () => {
    let run = armed();
    run = addAction(
      run,
      action({ tool: 'read', target: 'img.ts', result: 'see data:image/png;base64,iVBORw0KGgo=' }),
      limits(),
    );
    const state = judgeState(run, 12000);
    expect(JSON.stringify(state)).not.toContain('data:image');
    expect(JSON.stringify(state)).not.toContain('iVBORw0KGgo');
  });

  it('maxChars を超える actions で末尾を落とし、truncated が true', () => {
    let run = armed();
    for (let index = 0; index < 5; index += 1) {
      run = addAction(run, action({ target: `f${index}.ts`, result: 'x'.repeat(100) }), limits());
    }
    const state = judgeState(run, 200);
    expect(state['truncated']).toBe(true);
    const investigation = state['investigation'];
    expect(Array.isArray(investigation)).toBe(true);
    if (Array.isArray(investigation)) {
      expect(investigation.length).toBeLessThan(5);
    }
  });
});
