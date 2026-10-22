import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../settings/schema.ts';
import type { Usage } from '../entry/data.ts';
import type { Candidate, EntryMessage } from './collect.ts';
import { runPass, type PassPorts } from './run.ts';
import { topicView } from './judge.ts';

function candidate(id: string, chars: number, excerpt = 'excerpt'): Candidate {
  return { id, toolName: 'read', args: `read({"path":"${id}.txt"})`, chars, excerpt };
}

function recent(): readonly EntryMessage[] {
  return [{ role: 'user', content: [{ type: 'text', text: '最近の話題' }], timestamp: 1 }];
}

function summarizeOk(summary: string, usage?: Usage): PassPorts['summarize'] {
  return () => Promise.resolve({ kind: 'ok', summary, usage });
}

function classifyWith(
  probabilities: Readonly<Partial<Record<string, number>>>,
  calls: { count: number },
  failAt?: number,
): PassPorts['classify'] {
  return (request) => {
    calls.count += 1;
    if (failAt !== undefined && calls.count === failAt) {
      return Promise.resolve({ kind: 'failed', reason: 'classifier boom' });
    }
    const answers: Record<string, { type: string; probabilities: Record<string, number> }> = {};
    for (const key of Object.keys(request.questions)) {
      const probability = probabilities[key];
      if (probability === undefined) {
        continue;
      }
      answers[key] = { type: 'choice', probabilities: { keep: probability } };
    }
    return Promise.resolve({ kind: 'ok', answers });
  };
}

describe('runPass', () => {
  it('要約が返り、答えが 0.8 と 0.1 → done、dropped 1 件、kept 1 件', async () => {
    const calls = { count: 0 };
    const ports: PassPorts = {
      summarize: summarizeOk('テストの要約'),
      classify: classifyWith({ keep_a: 0.8, keep_b: 0.1 }, calls),
    };
    const outcome = await runPass(
      {
        settings: defaultSettings(),
        tokens: 60000,
        candidates: [candidate('a', 100), candidate('b', 50)],
        recent: recent(),
        now: 1000,
      },
      ports,
    );
    expect(outcome.kind).toBe('done');
    if (outcome.kind !== 'done') {
      throw new Error('must be done');
    }
    expect(outcome.pass.summary).toBe('テストの要約');
    expect(outcome.pass.dropped).toEqual([{ id: 'b', chars: 50 }]);
    expect(outcome.pass.droppedChars).toBe(50);
    expect(outcome.pass.droppedTokens).toBe(13);
    expect(outcome.pass.kept).toBe(1);
    expect(outcome.pass.tokensBefore).toBe(60000);
    expect(outcome.pass.at).toBe(1000);
  });

  it('view 1000 文字・抜粋 1000 文字の候補 100 件 → 予算で 2 回以上に割れる', async () => {
    // view 1000 文字ぶんの fixed 400 に対し、質問 1 件 ~482 で 100 件は ~48200 になる。
    const calls = { count: 0 };
    const long: Candidate[] = [];
    for (let index = 0; index < 100; index += 1) {
      long.push(candidate(`c${index}`, 1000, 'x'.repeat(1000)));
    }
    const probs: Record<string, number> = {};
    for (const item of long) {
      probs[`keep_${item.id}`] = 0.9;
    }
    const ports: PassPorts = {
      summarize: summarizeOk('x'.repeat(1000)),
      classify: classifyWith(probs, calls),
    };
    const outcome = await runPass(
      { settings: defaultSettings(), tokens: 60000, candidates: long, recent: recent(), now: 1000 },
      ports,
    );
    expect(outcome.kind).toBe('done');
    expect(calls.count).toBeGreaterThanOrEqual(2);
  });

  it('要約の view が大きい → fixed が効いて束が増え、state には view が入る', async () => {
    // 66 件 × ~482 トークン = ~31812 で fixed 無しなら 1 束に収まる。
    // view（Goal 節 ~1008 文字ぶん ~404 トークン）を引くと 2 束以上に割れる。
    const full = ['## Goal', 'x'.repeat(1000), '', '## Constraints & Preferences', '- none'].join(
      '\n',
    );
    const seen: unknown[] = [];
    const calls = { count: 0 };
    const ports: PassPorts = {
      summarize: summarizeOk(full),
      classify: (request) => {
        calls.count += 1;
        seen.push(request.state['summary']);
        return Promise.resolve({ kind: 'ok', answers: {} });
      },
    };
    const long: Candidate[] = [];
    for (let index = 0; index < 66; index += 1) {
      long.push(candidate(`c${index}`, 1000, 'x'.repeat(1000)));
    }
    const outcome = await runPass(
      { settings: defaultSettings(), tokens: 60000, candidates: long, recent: recent(), now: 1000 },
      ports,
    );
    expect(outcome.kind).toBe('done');
    expect(calls.count).toBeGreaterThanOrEqual(2);
    expect(seen).toHaveLength(calls.count);
    for (const summary of seen) {
      expect(summary).toBe(topicView(full));
      expect(summary).not.toContain('Constraints');
    }
  });

  it('2 束目の classify が failed → failed', async () => {
    const calls = { count: 0 };
    const long: Candidate[] = [];
    for (let index = 0; index < 100; index += 1) {
      long.push(candidate(`c${index}`, 1000, 'x'.repeat(1000)));
    }
    const ports: PassPorts = {
      summarize: summarizeOk('test summary'),
      classify: classifyWith({}, calls, 2),
    };
    const outcome = await runPass(
      { settings: defaultSettings(), tokens: 60000, candidates: long, recent: recent(), now: 1000 },
      ports,
    );
    expect(outcome).toEqual({ kind: 'failed', reason: 'classifier boom' });
  });

  it('summarize が failed → failed', async () => {
    const ports: PassPorts = {
      summarize: () => Promise.resolve({ kind: 'failed', reason: 'summarize boom' }),
      classify: classifyWith({}, { count: 0 }),
    };
    const outcome = await runPass(
      {
        settings: defaultSettings(),
        tokens: 60000,
        candidates: [candidate('a', 10)],
        recent: recent(),
        now: 1000,
      },
      ports,
    );
    expect(outcome).toEqual({ kind: 'failed', reason: 'summarize boom' });
  });

  it('要約が空文字 → failed（理由に summary）', async () => {
    const ports: PassPorts = {
      summarize: summarizeOk('   '),
      classify: classifyWith({}, { count: 0 }),
    };
    const outcome = await runPass(
      {
        settings: defaultSettings(),
        tokens: 60000,
        candidates: [candidate('a', 10)],
        recent: recent(),
        now: 1000,
      },
      ports,
    );
    expect(outcome.kind).toBe('failed');
    if (outcome.kind !== 'failed') {
      throw new Error('must be failed');
    }
    expect(outcome.reason).toContain('summary');
  });

  it('候補 0 件 → summarize を呼ばず done、dropped 0、kept 0、summary は空', async () => {
    const calls = { summarize: 0, classify: 0 };
    const ports: PassPorts = {
      summarize: () => {
        calls.summarize += 1;
        return Promise.resolve({ kind: 'ok', summary: '使われない要約', usage: undefined });
      },
      classify: () => {
        calls.classify += 1;
        return Promise.resolve({ kind: 'ok', answers: {} });
      },
    };
    const outcome = await runPass(
      { settings: defaultSettings(), tokens: 60000, candidates: [], recent: recent(), now: 1000 },
      ports,
    );
    expect(outcome.kind).toBe('done');
    if (outcome.kind !== 'done') {
      throw new Error('must be done');
    }
    expect(calls.summarize).toBe(0);
    expect(calls.classify).toBe(0);
    expect(outcome.pass.dropped).toEqual([]);
    expect(outcome.pass.kept).toBe(0);
    expect(outcome.pass.summary).toBe('');
  });

  it('1 件の答えが欠けている → その候補は keep で done', async () => {
    const ports: PassPorts = {
      summarize: summarizeOk('テストの要約'),
      classify: classifyWith({ keep_a: 0.8 }, { count: 0 }),
    };
    const outcome = await runPass(
      {
        settings: defaultSettings(),
        tokens: 60000,
        candidates: [candidate('a', 100), candidate('b', 50)],
        recent: recent(),
        now: 1000,
      },
      ports,
    );
    expect(outcome.kind).toBe('done');
    if (outcome.kind !== 'done') {
      throw new Error('must be done');
    }
    expect(outcome.pass.dropped).toEqual([]);
    expect(outcome.pass.kept).toBe(2);
    expect(outcome.pass.droppedTokens).toBe(0);
  });

  it('201 文字を 2 件落とす → droppedTokens は 102（合計してから割った 101 ではない）', async () => {
    const ports: PassPorts = {
      summarize: summarizeOk('テストの要約'),
      classify: classifyWith({ keep_a: 0.1, keep_b: 0.1 }, { count: 0 }),
    };
    const outcome = await runPass(
      {
        settings: defaultSettings(),
        tokens: 60000,
        candidates: [candidate('a', 201), candidate('b', 201)],
        recent: recent(),
        now: 1000,
      },
      ports,
    );
    expect(outcome.kind).toBe('done');
    if (outcome.kind !== 'done') {
      throw new Error('must be done');
    }
    expect(outcome.pass.droppedTokens).toBe(102);
    expect(outcome.pass.droppedChars).toBe(402);
  });
});
