import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../settings/schema.ts';
import type { Usage } from '../entry/data.ts';
import type { Candidate, EntryMessage } from './collect.ts';
import { runPass, type PassPorts } from './run.ts';

function candidate(id: string, chars: number): Candidate {
  return { id, toolName: 'read', args: `read({"path":"${id}.txt"})`, chars };
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
      answers[key] = { type: 'choice', probabilities: { yes: probability } };
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
    expect(outcome.pass.kept).toBe(1);
    expect(outcome.pass.tokensBefore).toBe(60000);
    expect(outcome.pass.at).toBe(1000);
  });

  it('候補 3 件・maxQuestions 2 → classify が 2 回', async () => {
    const calls = { count: 0 };
    const ports: PassPorts = {
      summarize: summarizeOk('テストの要約'),
      classify: classifyWith({ keep_a: 0.9, keep_b: 0.9, keep_c: 0.9 }, calls),
    };
    const outcome = await runPass(
      {
        settings: { ...defaultSettings(), maxQuestions: 2 },
        tokens: 60000,
        candidates: [candidate('a', 10), candidate('b', 20), candidate('c', 30)],
        recent: recent(),
        now: 1000,
      },
      ports,
    );
    expect(calls.count).toBe(2);
    expect(outcome.kind).toBe('done');
  });

  it('2 束目の classify が failed → failed', async () => {
    const calls = { count: 0 };
    const ports: PassPorts = {
      summarize: summarizeOk('テストの要約'),
      classify: classifyWith({}, calls, 2),
    };
    const outcome = await runPass(
      {
        settings: { ...defaultSettings(), maxQuestions: 2 },
        tokens: 60000,
        candidates: [candidate('a', 10), candidate('b', 20), candidate('c', 30)],
        recent: recent(),
        now: 1000,
      },
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

  it('候補 0 件 → done、dropped 0、kept 0', async () => {
    const calls = { count: 0 };
    const ports: PassPorts = {
      summarize: summarizeOk('使われない要約'),
      classify: classifyWith({}, calls),
    };
    const outcome = await runPass(
      { settings: defaultSettings(), tokens: 60000, candidates: [], recent: recent(), now: 1000 },
      ports,
    );
    expect(outcome.kind).toBe('done');
    if (outcome.kind !== 'done') {
      throw new Error('must be done');
    }
    expect(outcome.pass.dropped).toEqual([]);
    expect(outcome.pass.kept).toBe(0);
    expect(calls.count).toBe(0);
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
  });
});
