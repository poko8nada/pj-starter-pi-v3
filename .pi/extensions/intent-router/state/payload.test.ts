import { describe, expect, it } from 'vitest';
import type { ClassifierCandidate } from '../settings/schema.ts';
import { defaultSettings } from '../settings/schema.ts';
import { addAction, arm, noteTurn, type Action, type Run } from './run.ts';
import {
  asInput,
  judgePayload,
  lastAssistantText,
  minimizeText,
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

  it('fetch_content は url を抜く（無ければ urls の先頭）', () => {
    expect(targetOf('fetch_content', { url: 'https://x' })).toBe('https://x');
    expect(targetOf('fetch_content', { urls: ['https://a', 'https://b'] })).toBe('https://a');
  });

  it('quick_edit と target_edit は path を抜く', () => {
    expect(targetOf('quick_edit', { path: 'a.ts' })).toBe('a.ts');
    expect(targetOf('target_edit', { path: 'a.ts' })).toBe('a.ts');
  });

  it('調べ物の的を抜く（source_check / get_search_content / consult_subagents）', () => {
    expect(targetOf('source_check', { claim: 'c' })).toBe('c');
    expect(targetOf('get_search_content', { responseId: 'r1' })).toBe('r1');
    expect(targetOf('consult_subagents', { action: 'list' })).toBe('list');
  });

  it('codemode の的は空（1 回の束ねた呼び出しを 1 件として数える）', () => {
    expect(targetOf('codemode', { code: '...' })).toBe('');
  });

  it('fetch_content に url も urls も無い → 空', () => {
    expect(targetOf('fetch_content', {})).toBe('');
  });

  it('asInput が記録以外を {} にする', () => {
    expect(asInput({ path: 'x.ts' })).toEqual({ path: 'x.ts' });
    expect(asInput('x.ts')).toEqual({});
  });
});

describe('routePayload', () => {
  it('owner_now と agent_prev の2つだけ', () => {
    const { payload, truncated } = routePayload('hello', 'prev', defaultSettings());
    expect(payload).toEqual({ owner_now: 'hello', agent_prev: 'prev' });
    expect(truncated).toBe(false);
  });

  it('セッションに前の発言が無い → agent_prev は空文字', () => {
    expect(lastAssistantText([], 2000)).toBe('');
  });

  it('owner_now が上限より長い → textChars で切れる', () => {
    const settings = defaultSettings();
    const { payload, truncated } = routePayload(
      'あ'.repeat(settings.state.textChars + 10),
      '',
      settings,
    );
    expect(payload.owner_now.length).toBe(settings.state.textChars);
    expect(truncated).toBe(true);
  });

  it('owner は短く agent_prev だけが長い → truncated が true', () => {
    const settings = defaultSettings();
    const { payload, truncated } = routePayload(
      'hello',
      'あ'.repeat(settings.state.textChars + 1),
      settings,
    );
    expect(payload.agent_prev.length).toBe(settings.state.textChars);
    expect(truncated).toBe(true);
  });

  it('どちらも短い → truncated が false', () => {
    const { truncated } = routePayload('hello', 'prev', defaultSettings());
    expect(truncated).toBe(false);
  });

  it('前の発言が上限より長い → textChars で切れる', () => {
    const settings = defaultSettings();
    const text = lastAssistantText(
      [{ role: 'assistant', content: 'あ'.repeat(settings.state.textChars + 10) }],
      settings.state.textChars,
    );
    expect(text.length).toBe(settings.state.textChars);
    const { payload } = routePayload('hello', 'あ'.repeat(settings.state.textChars + 10), settings);
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

  it('base64 の塊は送らない', () => {
    const text = lastAssistantText(
      [{ role: 'assistant', content: 'see data:image/png;base64,iVBORw0KGgo=' }],
      2000,
    );
    expect(text).not.toContain('data:image');
    expect(text).not.toContain('iVBORw0KGgo');
  });
});

describe('minimizeText', () => {
  it('改行と連続した空白を 1 つの空白に詰める', () => {
    expect(minimizeText('a\n\n b   c', 100)).toBe('a b c');
  });

  it('詰めてから切る（先に切ると xxx になる）', () => {
    expect(minimizeText('xxx\n\n\nyyy', 4)).toBe('xxx ');
  });

  it('画像の base64 を落とす', () => {
    expect(minimizeText('see data:image/png;base64,iVBORw0KGgo=', 100)).toBe('see [image omitted]');
  });
});

describe('judgePayload', () => {
  it('owner_text / agent_text / read / related の 4 つを組む', () => {
    let run = armed();
    run = addAction(run, action({ target: 'x.ts' }), limits());
    const { payload, truncated } = judgePayload(run, defaultSettings());
    expect(payload.owner_text).toBe('hello');
    expect(payload.agent_text).toBe('');
    expect(payload.read).toHaveLength(1);
    expect(payload.related).toHaveLength(0);
    expect(truncated).toBe(false);
  });

  it('read に足した action が payload の read に出る', () => {
    let run = armed();
    run = addAction(run, action({ target: 'read-target.ts' }), limits());
    const { payload } = judgePayload(run, defaultSettings());
    expect(payload.read).toHaveLength(1);
    expect(payload.read[0]).toMatchObject({ tool: 'read', target: 'read-target.ts' });
  });

  it('related の action が payload の related に出る', () => {
    let run = armed();
    run = addAction(run, action({ target: 'related-target.ts' }), limits());
    run = noteTurn(run, 'assistant text', limits());
    const { payload } = judgePayload(run, defaultSettings());
    expect(payload.read).toHaveLength(0);
    expect(payload.related).toHaveLength(1);
    expect(payload.related[0]).toMatchObject({ tool: 'read', target: 'related-target.ts' });
  });

  it('state.textChars より長い owner の発言 → owner_text がその字数になる', () => {
    const settings = defaultSettings();
    const longOwner = 'あ'.repeat(settings.state.textChars + 10);
    let run = arm({
      ownerNow: longOwner,
      choice: 'reply',
      confidence: 0.9,
      candidate: CANDIDATE,
      now: 1,
    });
    run = addAction(run, action({ target: 'x.ts' }), limits());
    const { payload } = judgePayload(run, settings);
    expect(payload.owner_text.length).toBe(settings.state.textChars);
  });

  it('直前のエージェント発言 → agent_text に入り、state.assistantChars で切れる', () => {
    const settings = defaultSettings();
    const max = settings.state.assistantChars;
    let run = armed();
    run = noteTurn(run, 'あ'.repeat(max + 10), limits());
    run = addAction(run, action({ target: 'x.ts' }), limits());
    const { payload } = judgePayload(run, settings);
    expect(payload.agent_text.length).toBe(max);
  });

  it('owner_text は minimize で詰める（改行が残らない）', () => {
    let run = arm({
      ownerNow: 'a\n\n b   c',
      choice: 'reply',
      confidence: 0.9,
      candidate: CANDIDATE,
      now: 1,
    });
    run = addAction(run, action({ target: 'x.ts' }), limits());
    const { payload } = judgePayload(run, defaultSettings());
    expect(payload.owner_text).toBe('a b c');
    expect(payload.owner_text).not.toContain('\n');
  });

  it('agent_text は minimize で詰める（改行が残らない）', () => {
    let run = armed();
    run = noteTurn(run, 'x\n\n  y', limits());
    run = addAction(run, action({ target: 'x.ts' }), limits());
    const { payload } = judgePayload(run, defaultSettings());
    expect(payload.agent_text).toBe('x y');
    expect(payload.agent_text).not.toContain('\n');
  });

  it('道具の呼び出しブロックを含む発言 → agent_text に呼び出しの中身が出ない', () => {
    const text = lastAssistantText(
      [
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'plain answer' },
            { type: 'toolCall', name: 'read', arguments: { path: 'secret.ts' } },
          ],
        },
      ],
      2000,
    );
    expect(text).toBe('plain answer');
    expect(text).not.toContain('secret.ts');
  });

  it('read も related も空 → payload の 2 つは空の配列', () => {
    const { payload } = judgePayload(armed(), defaultSettings());
    expect(payload.read).toEqual([]);
    expect(payload.related).toEqual([]);
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

  it('state が maxStateChars を超える → related を後ろから削る', () => {
    const settings = {
      ...defaultSettings(),
      state: { ...defaultSettings().state, maxStateChars: 500 },
    };
    let run = armed();
    for (let index = 0; index < 4; index += 1) {
      run = addAction(run, action({ target: `f${index}.ts`, result: 'x'.repeat(100) }), limits());
    }
    run = noteTurn(run, 'text', limits());
    const { truncated } = judgePayload(run, settings);
    expect(truncated).toBe(true);
  });
});
