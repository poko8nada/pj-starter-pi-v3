import { describe, expect, it } from 'vitest';
import type { ClassifierCandidate } from '../settings/schema.ts';
import { defaultSettings } from '../settings/schema.ts';
import { addAction, arm, type Action, type Run } from './run.ts';
import {
  asInput,
  judgePayload,
  lastAssistantText,
  routePayload,
  targetOf,
  toAction,
} from './payload.ts';

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

describe('routePayload', () => {
  it('owner_now と agent_prev の2つだけ', () => {
    const payload = routePayload('hello', 'prev', defaultSettings());
    expect(payload).toEqual({ owner_now: 'hello', agent_prev: 'prev' });
  });

  it('セッションに前の発言が無い → agent_prev は空文字', () => {
    expect(lastAssistantText([], 2000)).toBe('');
  });

  it('owner_now が上限より長い → textChars で切れる', () => {
    const settings = defaultSettings();
    const payload = routePayload('あ'.repeat(settings.state.textChars + 10), '', settings);
    expect(payload.owner_now.length).toBe(settings.state.textChars);
  });

  it('前の発言が上限より長い → textChars で切れる', () => {
    const settings = defaultSettings();
    const text = lastAssistantText(
      [{ role: 'assistant', content: 'あ'.repeat(settings.state.textChars + 10) }],
      settings.state.textChars,
    );
    expect(text.length).toBe(settings.state.textChars);
    const payload = routePayload('hello', 'あ'.repeat(settings.state.textChars + 10), settings);
    expect(payload.agent_prev.length).toBe(settings.state.textChars);
  });
});

describe('lastAssistantText', () => {
  it('最後のエージェントの文を抜く', () => {
    const text = lastAssistantText(
      [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'previous answer' },
      ],
      2000,
    );
    expect(text).toBe('previous answer');
  });

  it('画像つきの発言 → 文だけ残し画像を入れない', () => {
    const text = lastAssistantText(
      [
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'looking into it' },
            { type: 'image', data: 'data:image/png;base64,iVBORw0KGgo=' },
          ],
        },
      ],
      2000,
    );
    expect(text).toBe('looking into it');
    expect(text).not.toContain('data:image');
  });

  it('base64 の塊は送らない', () => {
    const text = lastAssistantText(
      [{ role: 'assistant', content: 'see data:image/png;base64,iVBORw0KGgo=' }],
      2000,
    );
    expect(text).not.toContain('data:image');
    expect(text).not.toContain('iVBORw0KGgo');
  });
});

describe('judgePayload', () => {
  it('owner_now / agent_text / latest / earlier の 4 つを組む', () => {
    let run = armed();
    run = addAction(run, action({ target: 'x.ts' }), limits());
    const { payload, truncated } = judgePayload(run, defaultSettings());
    expect(payload.owner_now).toBe('hello');
    expect(payload.agent_text).toBe('');
    expect(payload.latest).toHaveLength(1);
    expect(payload.earlier).toHaveLength(0);
    expect(truncated).toBe(false);
  });

  it('画像・base64 の文字列を含まない', () => {
    let run = armed();
    run = addAction(
      run,
      action({ tool: 'read', target: 'img.ts', result: 'see data:image/png;base64,iVBORw0KGgo=' }),
      limits(),
    );
    const { payload } = judgePayload(run, defaultSettings());
    expect(JSON.stringify(payload)).not.toContain('data:image');
    expect(JSON.stringify(payload)).not.toContain('iVBORw0KGgo');
  });

  it('state が maxStateChars を超える → earlier を後ろから削る', () => {
    const settings = {
      ...defaultSettings(),
      state: { ...defaultSettings().state, maxStateChars: 500 },
    };
    let run = armed();
    for (let index = 0; index < 4; index += 1) {
      run = addAction(run, action({ target: `f${index}.ts`, result: 'x'.repeat(100) }), limits());
    }
    const { truncated } = judgePayload(run, settings);
    expect(truncated).toBe(true);
  });
});
