import { describe, expect, it } from 'vitest';
import type { ClassifierCandidate } from '../settings/schema.ts';
import { defaultSettings } from '../settings/schema.ts';
import { addAction, arm, type Action, type Run } from './run.ts';
import { asInput, judgeState, routeState, targetOf, toAction } from './payload.ts';

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
