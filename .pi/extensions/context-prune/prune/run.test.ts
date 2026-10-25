import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../settings/schema.ts';
import type { Usage } from '../entry/data.ts';
import type { Candidate, EntryMessage } from './collect.ts';
import { runPass, type PassPorts } from './run.ts';

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
  const reason = 'classifier boom';
  return (request) => {
    calls.count += 1;
    if (failAt !== undefined && calls.count === failAt) {
      return Promise.resolve({ kind: 'failed', reason });
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
  it('要約と答え → done、dropped と kept の件数', async () => {
    const calls = { count: 0 };
    const summary = 'テストの要約';
    const keepHigh = 0.8;
    const keepLow = 0.1;
    const ports: PassPorts = {
      summarize: summarizeOk(summary),
      classify: classifyWith({ keep_a: keepHigh, keep_b: keepLow }, calls),
    };
    const aChars = 100;
    const bChars = 50;
    const tokens = 60000;
    const now = 1000;
    const outcome = await runPass(
      {
        settings: defaultSettings(),
        tokens,
        candidates: [candidate('a', aChars), candidate('b', bChars)],
        recent: recent(),
        now,
      },
      ports,
    );
    expect(outcome.kind).toBe('done');
    if (outcome.kind !== 'done') {
      throw new Error('must be done');
    }
    expect(outcome.pass.summary).toBe(summary);
    expect(outcome.pass.dropped).toEqual([{ id: 'b', chars: bChars }]);
    expect(outcome.pass.droppedChars).toBe(bChars);
    expect(outcome.pass.droppedTokens).toBe(Math.ceil(bChars / 4));
    expect(outcome.pass.kept).toBe(1);
    expect(outcome.pass.tokensBefore).toBe(tokens);
    expect(outcome.pass.at).toBe(now);
  });

  it('候補 100 件 → 予算で 2 回以上に割れる', async () => {
    const calls = { count: 0 };
    const count = 100;
    const long: Candidate[] = [];
    for (let index = 0; index < count; index += 1) {
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

  it('要約の view が大きい → 束が増え、state には絞った要約が入る', async () => {
    const goalText = 'x'.repeat(1000);
    const excludedHeading = '## Constraints & Preferences';
    const full = ['## Goal', goalText, '', excludedHeading, '- none'].join('\n');
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
    const count = 66;
    const long: Candidate[] = [];
    for (let index = 0; index < count; index += 1) {
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
      expect(summary).toContain(goalText);
      expect(summary).not.toContain(excludedHeading);
    }
  });

  it('2 束目の classify が failed → failed', async () => {
    const calls = { count: 0 };
    const count = 100;
    const long: Candidate[] = [];
    for (let index = 0; index < count; index += 1) {
      long.push(candidate(`c${index}`, 1000, 'x'.repeat(1000)));
    }
    const reason = 'classifier boom';
    const ports: PassPorts = {
      summarize: summarizeOk('test summary'),
      classify: classifyWith({}, calls, 2),
    };
    const outcome = await runPass(
      { settings: defaultSettings(), tokens: 60000, candidates: long, recent: recent(), now: 1000 },
      ports,
    );
    expect(outcome).toEqual({ kind: 'failed', reason });
  });

  it('summarize が failed → failed', async () => {
    const reason = 'summarize boom';
    const ports: PassPorts = {
      summarize: () => Promise.resolve({ kind: 'failed', reason }),
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
    expect(outcome).toEqual({ kind: 'failed', reason });
  });

  it('要約が空文字 → failed', async () => {
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
    expect(outcome.pass.droppedTokens).toBe(0);
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

  it('201 文字を 2 件落とす → 件ごとに切り上げて合計した値', async () => {
    const chars = 201;
    const ports: PassPorts = {
      summarize: summarizeOk('テストの要約'),
      classify: classifyWith({ keep_a: 0.1, keep_b: 0.1 }, { count: 0 }),
    };
    const outcome = await runPass(
      {
        settings: defaultSettings(),
        tokens: 60000,
        candidates: [candidate('a', chars), candidate('b', chars)],
        recent: recent(),
        now: 1000,
      },
      ports,
    );
    expect(outcome.kind).toBe('done');
    if (outcome.kind !== 'done') {
      throw new Error('must be done');
    }
    expect(outcome.pass.droppedTokens).toBe(Math.ceil(chars / 4) + Math.ceil(chars / 4));
    expect(outcome.pass.droppedChars).toBe(chars + chars);
  });
});
