import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import type { Answer, Ask, AskOutcome, AskRequest } from '../classifier.ts';
import { append, type LogRecord } from '../log.ts';
import { defaultSettings, type Settings } from '../settings.ts';
import {
  arm,
  countJudgement,
  fire,
  idleRun,
  noteTurn,
  type FlagsPort,
  type Run,
  type RunPort,
} from '../state.ts';
import {
  decideJudge,
  due,
  registerJudge,
  stopMessage,
  type JudgePiPort,
  type JudgeTurnEvent,
} from './judge.ts';

type Handler = (
  event: JudgeTurnEvent,
  ctx: { readonly cwd: string },
) => Promise<
  | {
      readonly entries: readonly {
        readonly type: 'custom_message';
        readonly customType: string;
        readonly content: string;
        readonly display: boolean;
      }[];
    }
  | undefined
>;

const CANDIDATE = { provider: 'opencode', model: 'jev-1.13-free' };

function scoreAnswer(score: number, confidence: number): Answer {
  return { type: 'score', score, confidence };
}

function choiceAnswer(): Answer {
  return { type: 'choice', choice: 'design', probabilities: { design: 0.9 }, confidence: 0.9 };
}

function answeredOutcome(score: number, confidence: number): AskOutcome {
  return {
    kind: 'answered',
    provider: 'opencode',
    model: 'jev-1.13-free',
    answer: scoreAnswer(score, confidence),
    usage: { input: 1, output: 0, cost: 0 },
    latencyMs: 5,
  };
}

function failedOutcome(): AskOutcome {
  return { kind: 'failed', tried: ['opencode/jev-1.13-free'], reason: 'boom', latencyMs: 5 };
}

function fakeAsk(outcome: AskOutcome): { readonly ask: Ask; readonly requests: AskRequest[] } {
  const requests: AskRequest[] = [];
  const ask: Ask = (request) => {
    requests.push(request);
    return Promise.resolve(outcome);
  };
  return { ask, requests };
}

function fakeRun(initial?: Run): RunPort {
  let current: Run = initial ?? idleRun();
  return {
    get: () => current,
    set: (next) => {
      current = next;
    },
  };
}

function fakeFlags(enabled: boolean): FlagsPort {
  let current = { enabled };
  return {
    get: () => current,
    set: (next) => {
      current = next;
    },
  };
}

function fakePi(): { readonly pi: JudgePiPort; readonly handler: () => Handler } {
  let captured: Handler | undefined;
  const pi: JudgePiPort = {
    on: (_event, next) => {
      captured = next;
    },
  };
  return {
    pi,
    handler: () => {
      if (captured === undefined) {
        throw new Error('handler was not registered');
      }
      return captured;
    },
  };
}

/** arm して noteTurn を回数ぶん重ねた run（turns を進めるのに使う） */
function armedWithTurns(turns: number): Run {
  let run: Run = arm({
    prompt: 'hello',
    label: 'question',
    confidence: 0.9,
    candidate: CANDIDATE,
    now: 1,
  });
  for (let index = 0; index < turns; index += 1) {
    run = noteTurn(run, `text${index}`, defaultSettings().state, index + 2);
  }
  return run;
}

function withJudge(settings: Settings, patch: Partial<Settings['judge']>): Settings {
  return { ...settings, judge: { ...settings.judge, ...patch } };
}

function withStop(settings: Settings, patch: Partial<Settings['stop']>): Settings {
  return { ...settings, stop: { ...settings.stop, ...patch } };
}

function withMaxStateChars(settings: Settings, maxStateChars: number): Settings {
  return { ...settings, budget: { ...settings.budget, maxStateChars } };
}

function readContent(event: JudgeTurnEvent): object[] {
  const content = event.message.content;
  if (!Array.isArray(content)) {
    return [];
  }
  return content.filter((block): block is object => typeof block === 'object' && block !== null);
}

function readTurn(): JudgeTurnEvent {
  return {
    turnIndex: 2,
    message: {
      content: [
        { type: 'text', text: 'looking into it' },
        { type: 'toolCall', id: '1', name: 'read', arguments: { path: 'x.ts' } },
      ],
    },
    toolResults: [
      { toolName: 'read', content: [{ type: 'text', text: 'file body' }], isError: false },
    ],
  };
}

function wired(
  settings: Settings,
  outcome: AskOutcome,
  enabled: boolean,
  initial?: Run,
): {
  readonly handler: Handler;
  readonly run: RunPort;
  readonly requests: AskRequest[];
  readonly dir: string;
} {
  const dir = tmpDir();
  const { ask, requests } = fakeAsk(outcome);
  const run = fakeRun(initial);
  const { pi, handler } = fakePi();
  registerJudge(pi, {
    settings,
    ask,
    run,
    flags: fakeFlags(enabled),
    log: (record: LogRecord) => {
      append(record, dir);
    },
  });
  return { handler: handler(), run, requests, dir };
}

function isLogRecord(value: unknown): value is LogRecord {
  return typeof value === 'object' && value !== null && 'hook' in value && 'at' in value;
}

function readRecords(dir: string): LogRecord[] {
  const out: LogRecord[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.jsonl')) {
      continue;
    }
    const text = readFileSync(join(dir, name), 'utf8');
    for (const line of text.split('\n')) {
      if (line === '') {
        continue;
      }
      const parsed: unknown = JSON.parse(line);
      if (isLogRecord(parsed)) {
        out.push(parsed);
      }
    }
  }
  return out;
}

describe('decideJudge', () => {
  it('score 1.8 / confidence 0.8 → fire', () => {
    expect(decideJudge(scoreAnswer(1.8, 0.8), defaultSettings().thresholds)).toMatchObject({
      kind: 'fire',
    });
  });

  it('score ちょうど 1.5 / confidence ちょうど 0.5 → fire（閾値は >=）', () => {
    expect(decideJudge(scoreAnswer(1.5, 0.5), defaultSettings().thresholds)).toMatchObject({
      kind: 'fire',
    });
  });

  it('score 1.8 / confidence 0.49 → hold（片方だけ）', () => {
    expect(decideJudge(scoreAnswer(1.8, 0.49), defaultSettings().thresholds)).toMatchObject({
      kind: 'hold',
    });
  });

  it('score 1.49 / confidence 0.9 → hold（片方だけ）', () => {
    expect(decideJudge(scoreAnswer(1.49, 0.9), defaultSettings().thresholds)).toMatchObject({
      kind: 'hold',
    });
  });

  it('choice の答え → skip', () => {
    expect(decideJudge(choiceAnswer(), defaultSettings().thresholds)).toMatchObject({
      kind: 'skip',
    });
  });
});

describe('due', () => {
  it('idle の run → wait', () => {
    expect(due(idleRun(), defaultSettings(), 10)).toMatchObject({ kind: 'wait' });
  });

  it('turns: 1（minTurns: 2）→ wait、turns: 2 → due', () => {
    expect(due(armedWithTurns(1), defaultSettings(), 10)).toMatchObject({ kind: 'wait' });
    expect(due(armedWithTurns(2), defaultSettings(), 10)).toMatchObject({ kind: 'due' });
  });

  it('turns: 3（everyNTurns: 2）→ wait、turns: 4 → due', () => {
    const settings = withJudge(defaultSettings(), { everyNTurns: 2 });
    expect(due(armedWithTurns(3), settings, 10)).toMatchObject({ kind: 'wait' });
    expect(due(armedWithTurns(4), settings, 10)).toMatchObject({ kind: 'due' });
  });

  it('now - lastJudgedAt < minIntervalMs → wait、以上 → due', () => {
    const settings = defaultSettings();
    const judged = countJudgement(armedWithTurns(2), 1000);
    expect(due(judged, settings, 1000 + settings.budget.minIntervalMs - 1)).toMatchObject({
      kind: 'wait',
    });
    expect(due(judged, settings, 1000 + settings.budget.minIntervalMs)).toMatchObject({
      kind: 'due',
    });
  });

  it('fires: 1（maxFires: 1）→ wait', () => {
    const run = fire(armedWithTurns(2));
    expect(due(run, defaultSettings(), 10)).toMatchObject({ kind: 'wait' });
  });

  it('judgements: 12 → wait', () => {
    let run = armedWithTurns(2);
    for (let index = 0; index < 12; index += 1) {
      run = countJudgement(run, 10 + index);
    }
    expect(due(run, defaultSettings(), 100000)).toMatchObject({ kind: 'wait' });
  });
});

describe('stopMessage', () => {
  it('{label} を埋める', () => {
    expect(stopMessage('stop ({label})', 'question')).toBe('stop (question)');
  });
});

describe('registerJudge', () => {
  it('道具1件の turn_end と score 1.8 / 0.8 → entries が1件で continue の欄が無い', async () => {
    const settings = withJudge(defaultSettings(), { shadow: false });
    const { handler } = wired(settings, answeredOutcome(1.8, 0.8), true, armedWithTurns(2));
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result?.entries).toHaveLength(1);
    expect(result?.entries[0]).toMatchObject({ type: 'custom_message', customType: 'intent-stop' });
    expect(result?.entries[0]?.content).toBe(
      'Enough has been investigated to answer. Stop investigating: no new tool calls. Answer the owner from what you have, and name anything you could not confirm.',
    );
    expect(result).not.toHaveProperty('continue');
  });

  it('同じ handler を 2 回目に起こすと ask が呼ばれず undefined', async () => {
    const settings = withJudge(defaultSettings(), { shadow: false });
    const { handler, requests, dir } = wired(
      settings,
      answeredOutcome(1.8, 0.8),
      true,
      armedWithTurns(2),
    );
    await handler(readTurn(), { cwd: '/repo' });
    const second = await handler(readTurn(), { cwd: '/repo' });
    expect(second).toBeUndefined();
    expect(requests).toHaveLength(1);
    expect(readRecords(dir)).toHaveLength(1);
  });

  it('道具0件の turn_end → ask が呼ばれず undefined、ログに judge の行が増えない', async () => {
    const { handler, requests, dir } = wired(
      withJudge(defaultSettings(), { shadow: false }),
      answeredOutcome(1.8, 0.8),
      true,
      armedWithTurns(2),
    );
    const result = await handler(
      { turnIndex: 2, message: { content: 'done' }, toolResults: [] },
      { cwd: '/repo' },
    );
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(0);
    expect(readRecords(dir)).toHaveLength(0);
  });

  it('ask が failed → undefined でログの decision が hold・outcome が failed', async () => {
    const { handler, dir } = wired(
      withJudge(defaultSettings(), { shadow: false }),
      failedOutcome(),
      true,
      armedWithTurns(2),
    );
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    const records = readRecords(dir);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'judge', decision: 'hold' });
    if (records[0]?.hook === 'judge') {
      expect(records[0].outcome).toMatchObject({ kind: 'failed' });
    }
  });

  it('shadow: true → undefined でログの stop が would・text に文面', async () => {
    const { handler, dir } = wired(
      defaultSettings(),
      answeredOutcome(1.8, 0.8),
      true,
      armedWithTurns(2),
    );
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    const records = readRecords(dir);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'judge', decision: 'fire', stop: 'would' });
    if (records[0]?.hook === 'judge') {
      expect(records[0].text).toContain('Stop investigating');
    }
  });

  it('stop.enabled が false → undefined でログは fire・stop none・text null', async () => {
    const settings = withStop(withJudge(defaultSettings(), { shadow: false }), { enabled: false });
    const { handler, dir } = wired(settings, answeredOutcome(1.8, 0.8), true, armedWithTurns(2));
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    const records = readRecords(dir);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'judge', decision: 'fire', stop: 'none', text: null });
  });

  it('judge.enabled が false → ask が呼ばれずログも増えない', async () => {
    const settings = withJudge(defaultSettings(), { enabled: false });
    const { handler, requests, dir } = wired(
      settings,
      answeredOutcome(1.8, 0.8),
      true,
      armedWithTurns(2),
    );
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(0);
    expect(readRecords(dir)).toHaveLength(0);
  });

  it('idle のまま → ask が呼ばれずログも増えない', async () => {
    const { handler, requests, dir } = wired(
      withJudge(defaultSettings(), { shadow: false }),
      answeredOutcome(1.8, 0.8),
      true,
    );
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(0);
    expect(readRecords(dir)).toHaveLength(0);
  });

  it('助走中 → ask が呼ばれずログも増えない', async () => {
    const { handler, requests, dir } = wired(
      withJudge(defaultSettings(), { shadow: false }),
      answeredOutcome(1.8, 0.8),
      true,
      armedWithTurns(0),
    );
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(0);
    expect(readRecords(dir)).toHaveLength(0);
  });

  it('直後にまた来ても間隔で待つ → ask もログも増えない', async () => {
    const settings = withJudge(defaultSettings(), { shadow: false });
    const { handler, requests, dir } = wired(
      settings,
      answeredOutcome(1.0, 0.9),
      true,
      armedWithTurns(2),
    );
    await handler(readTurn(), { cwd: '/repo' });
    const second = await handler(readTurn(), { cwd: '/repo' });
    expect(second).toBeUndefined();
    expect(requests).toHaveLength(1);
    expect(readRecords(dir)).toHaveLength(1);
  });

  it('stop.display が false → entries の display が false', async () => {
    const settings = withStop(withJudge(defaultSettings(), { shadow: false }), { display: false });
    const { handler } = wired(settings, answeredOutcome(1.8, 0.8), true, armedWithTurns(2));
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result?.entries[0]?.display).toBe(false);
  });

  it('state が maxStateChars に収まらない → ログの truncated が true', async () => {
    const settings = withMaxStateChars(withJudge(defaultSettings(), { shadow: false }), 50);
    const { handler, dir } = wired(settings, answeredOutcome(1.8, 0.8), true, armedWithTurns(2));
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result?.entries).toHaveLength(1);
    const records = readRecords(dir);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'judge', truncated: true });
  });

  it('flags が off → undefined', async () => {
    const { handler, requests } = wired(
      withJudge(defaultSettings(), { shadow: false }),
      answeredOutcome(1.8, 0.8),
      false,
      armedWithTurns(2),
    );
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(0);
  });

  it('道具の結果が actions に入り、judgeState の investigation に載る', async () => {
    const settings = withJudge(defaultSettings(), { shadow: false });
    const { handler, run, requests } = wired(
      settings,
      answeredOutcome(1.8, 0.8),
      true,
      armedWithTurns(2),
    );
    const event = readTurn();
    expect(readContent(event)).toHaveLength(2);
    await handler(event, { cwd: '/repo' });
    const current = run.get();
    if (current.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(current.actions.map((action) => `${action.tool} ${action.target}`)).toContain(
      'read x.ts',
    );
    const investigation = requests[0]?.state['investigation'];
    expect(Array.isArray(investigation)).toBe(true);
    expect(JSON.stringify(investigation)).toContain('x.ts');
  });
});
