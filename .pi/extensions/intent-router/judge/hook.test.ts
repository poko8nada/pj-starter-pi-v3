import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import type { Answer, BatchAsk, BatchAskOutcome } from '../ask/ask.ts';
import { createRecent, type IntentRecord } from '../record/recent.ts';
import { defaultSettings, type Settings } from '../settings/schema.ts';
import {
  addAction,
  arm,
  countJudgement,
  idleRun,
  noteTurn,
  type FlagsPort,
  type Mode,
  type Run,
  type RunPort,
} from '../state/run.ts';
import { toAction } from '../state/payload.ts';
import { registerJudge, type JudgePiPort, type JudgeTurnEvent } from './hook.ts';

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

function choiceAnswer(choice: string, confidence: number): Answer {
  return { type: 'choice', choice, probabilities: { [choice]: confidence }, confidence };
}

function batchAnswered(related: Answer, answerable: Answer): BatchAskOutcome {
  return {
    kind: 'answered',
    provider: 'opencode',
    model: 'jev-1.13-free',
    answers: { related, answerable },
    usage: { input: 1, output: 0, cost: 0 },
    latencyMs: 5,
  };
}

function batchFailed(): BatchAskOutcome {
  return { kind: 'failed', tried: ['opencode/jev-1.13-free'], reason: 'boom', latencyMs: 5 };
}

function noNo(): BatchAskOutcome {
  return batchAnswered(choiceAnswer('no', 0.95), choiceAnswer('no', 0.95));
}

function yesNo(): BatchAskOutcome {
  return batchAnswered(choiceAnswer('yes', 0.95), choiceAnswer('no', 0.95));
}

function yesYes(): BatchAskOutcome {
  return batchAnswered(choiceAnswer('yes', 0.95), choiceAnswer('yes', 0.95));
}

function fakeAskBatch(outcomes: BatchAskOutcome[]): {
  readonly askBatch: BatchAsk;
  readonly requests: unknown[];
} {
  const requests: unknown[] = [];
  const queue = [...outcomes];
  const askBatch: BatchAsk = (request) => {
    requests.push(request);
    const next = queue.shift() ?? queue[queue.length - 1] ?? batchFailed();
    return Promise.resolve(next);
  };
  return { askBatch, requests };
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

function fakeFlags(mode: Mode): FlagsPort {
  let current = { mode };
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
  let run = arm({
    ownerNow: 'hello',
    choice: 'reply',
    confidence: 0.9,
    candidate: CANDIDATE,
    now: 1,
  });
  for (let index = 0; index < turns; index += 1) {
    run = noteTurn(run, `text${index}`, defaultSettings().state);
  }
  return run;
}

function withJudge(settings: Settings, patch: Partial<Settings['judge']>): Settings {
  return { ...settings, judge: { ...settings.judge, ...patch } };
}

function withMaxStateChars(settings: Settings, maxStateChars: number): Settings {
  return { ...settings, state: { ...settings.state, maxStateChars } };
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

function toolTurn(name: string, args: Record<string, unknown>, text: string): JudgeTurnEvent {
  return {
    turnIndex: 2,
    message: {
      content: [{ type: 'toolCall', id: '1', name, arguments: args }],
    },
    toolResults: [{ toolName: name, content: [{ type: 'text', text }], isError: false }],
  };
}

function readOf(request: unknown): Record<string, unknown>[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽 ask が受けた request の形を読む
  const state = (request as { readonly state: Readonly<Record<string, unknown>> }).state;
  const read = state['read'];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- read の形を読む
  return Array.isArray(read) ? (read as Record<string, unknown>[]) : [];
}

function wired(
  settings: Settings,
  outcomes: BatchAskOutcome[],
  mode: Mode,
  initial?: Run,
): {
  readonly handler: Handler;
  readonly run: RunPort;
  readonly requests: unknown[];
  readonly file: string;
} {
  const dir = tmpDir();
  const file = join(dir, 'recent.json');
  const recent = createRecent(50, file);
  const { askBatch, requests } = fakeAskBatch(outcomes);
  const run = fakeRun(initial);
  const { pi, handler } = fakePi();
  registerJudge(pi, {
    settings,
    askBatch,
    run,
    flags: fakeFlags(mode),
    log: (record: IntentRecord) => {
      recent.add(record);
    },
  });
  return { handler: handler(), run, requests, file };
}

function readRecords(file: string): IntentRecord[] {
  try {
    const text = readFileSync(file, 'utf8');
    if (text.trim() === '') {
      return [];
    }
    const out: IntentRecord[] = [];
    for (const line of text.split('\n')) {
      if (line.trim() === '') {
        continue;
      }
      try {
        const parsed: unknown = JSON.parse(line);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- recent.json の 1 行を読む
        if (typeof parsed === 'object' && parsed !== null && 'at' in parsed) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- recent.json の 1 行を読む
          out.push(parsed as IntentRecord);
        }
      } catch {
        continue;
      }
    }
    return out;
  } catch {
    return [];
  }
}

describe('registerJudge', () => {
  it('related=no かつ answerable=no が 2 回続く → nudge（unrelated は 2）', async () => {
    const settings = defaultSettings();
    const { handler, run, file } = wired(settings, [noNo(), noNo()], 'live', armedWithTurns(1));
    await handler(readTurn(), { cwd: '/repo' });
    const afterFirst = run.get();
    if (afterFirst.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(afterFirst.unrelated).toBe(1);
    const result = await handler(readTurn(), { cwd: '/repo' });
    const afterSecond = run.get();
    if (afterSecond.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(afterSecond.unrelated).toBe(2);
    expect(result?.entries).toHaveLength(1);
    expect(readRecords(file)).toHaveLength(2);
  });

  it('related=no が 1 回だけ → wait で unrelated は 1', async () => {
    const settings = defaultSettings();
    const { handler, run, file } = wired(settings, [noNo()], 'live', armedWithTurns(1));
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    const current = run.get();
    if (current.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(current.unrelated).toBe(1);
    expect(readRecords(file)).toHaveLength(1);
  });

  it('read が空（道具を使っていない往復）→ 何も聞かない', async () => {
    const settings = defaultSettings();
    const { handler, requests, file } = wired(settings, [noNo()], 'live', armedWithTurns(1));
    const result = await handler(
      {
        turnIndex: 2,
        message: { content: 'done' },
        toolResults: [{ toolName: 'mystery', content: 'x' }],
      },
      { cwd: '/repo' },
    );
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(0);
    expect(readRecords(file)).toHaveLength(0);
  });

  it('related の confidence が 0.79 → unrelated は増えず read は残る', async () => {
    const settings = defaultSettings();
    const low = batchAnswered(choiceAnswer('no', 0.79), choiceAnswer('no', 0.95));
    const { handler, run, requests, file } = wired(settings, [low], 'live', armedWithTurns(1));
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(1);
    const current = run.get();
    if (current.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(current.unrelated).toBe(0);
    expect(current.read).toHaveLength(1);
    expect(readRecords(file)).toHaveLength(1);
  });

  it('促しを 1 回出した後の往復 → nudge は出ない（maxNudges）', async () => {
    const settings = defaultSettings();
    const { handler, requests } = wired(
      settings,
      [noNo(), noNo(), noNo()],
      'live',
      armedWithTurns(1),
    );
    await handler(readTurn(), { cwd: '/repo' });
    const second = await handler(readTurn(), { cwd: '/repo' });
    expect(second?.entries).toHaveLength(1);
    const third = await handler(readTurn(), { cwd: '/repo' });
    expect(third).toBeUndefined();
    expect(requests).toHaveLength(2);
  });

  it('往復が minTurns 未満 → 聞かない', async () => {
    const settings = defaultSettings();
    const { handler, requests, file } = wired(settings, [noNo()], 'live', armedWithTurns(0));
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(0);
    expect(readRecords(file)).toHaveLength(0);
  });

  it('turns が everyNTurns で割り切れない → 聞かない（interval）', async () => {
    const settings = withJudge(defaultSettings(), { everyNTurns: 2 });
    const { handler, requests, file } = wired(settings, [noNo()], 'live', armedWithTurns(0));
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(0);
    expect(readRecords(file)).toHaveLength(0);
  });

  it('判断の回数が maxJudgements に達した → 聞かない', async () => {
    const settings = defaultSettings();
    let initial = armedWithTurns(1);
    for (let index = 0; index < 12; index += 1) {
      initial = countJudgement(initial, 10 + index);
    }
    const { handler, requests, file } = wired(settings, [noNo()], 'live', initial);
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(0);
    expect(readRecords(file)).toHaveLength(0);
  });

  it('2 問の classify が失敗 → 記録 1 行だけ残して何も出さない', async () => {
    const settings = defaultSettings();
    const { handler, file } = wired(settings, [batchFailed()], 'live', armedWithTurns(1));
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(readRecords(file)).toHaveLength(1);
  });

  it('shadow → 促しを差し込まずに記録だけ残る', async () => {
    const { handler, file } = wired(
      defaultSettings(),
      [noNo(), noNo()],
      'shadow',
      armedWithTurns(1),
    );
    await handler(readTurn(), { cwd: '/repo' });
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    const records = readRecords(file);
    expect(records).toHaveLength(2);
    expect(records[1]).toMatchObject({ hook: 'judge', fired: false });
    expect(typeof records[1]?.nudge).toBe('string');
  });

  it('live → 促しが 1 回だけ差し込まれる', async () => {
    const settings = defaultSettings();
    const { handler } = wired(settings, [noNo(), noNo()], 'live', armedWithTurns(1));
    await handler(readTurn(), { cwd: '/repo' });
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result?.entries).toHaveLength(1);
    expect(result?.entries[0]).toMatchObject({ type: 'custom_message', customType: 'intent-stop' });
  });

  it('2 問を 1 リクエストで聞く（related と answerable）', async () => {
    const settings = defaultSettings();
    const { handler, requests } = wired(settings, [noNo()], 'live', armedWithTurns(1));
    await handler(readTurn(), { cwd: '/repo' });
    expect(requests).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽 ask が受けた request の形を読む
    const request = requests[0] as {
      readonly questions: Readonly<Record<string, unknown>>;
      readonly state: Readonly<Record<string, unknown>>;
    };
    expect(Object.keys(request.questions).toSorted()).toEqual(['answerable', 'related']);
    expect(request.state['owner_text']).toBe('hello');
    expect(Array.isArray(request.state['read'])).toBe(true);
    expect(Array.isArray(request.state['related'])).toBe(true);
    expect(JSON.stringify(request.state)).not.toContain('data:image');
  });

  it('state が maxStateChars を超える → related を後ろから削る', async () => {
    const settings = withMaxStateChars(defaultSettings(), 500);
    let initial = arm({
      ownerNow: 'hello',
      choice: 'reply',
      confidence: 0.9,
      candidate: CANDIDATE,
      now: 1,
    });
    for (let index = 0; index < 4; index += 1) {
      initial = addAction(
        initial,
        toAction(1, 'read', { path: `f${index}.ts` }, 'x'.repeat(100), false, 300),
        defaultSettings().state,
      );
      initial = noteTurn(initial, `text${index}`, defaultSettings().state);
    }
    const { handler, file } = wired(settings, [noNo()], 'live', initial);
    await handler(readTurn(), { cwd: '/repo' });
    const records = readRecords(file);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'judge', fired: false });
  });

  it('idle のまま → ask が呼ばれずログも増えない', async () => {
    const settings = defaultSettings();
    const { handler, requests, file } = wired(settings, [noNo()], 'live');
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(0);
    expect(readRecords(file)).toHaveLength(0);
  });

  it('道具0件の turn_end → ask が呼ばれず undefined', async () => {
    const settings = defaultSettings();
    const { handler, requests, file } = wired(settings, [noNo()], 'live', armedWithTurns(1));
    const result = await handler(
      { turnIndex: 2, message: { content: 'done' }, toolResults: [] },
      { cwd: '/repo' },
    );
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(0);
    expect(readRecords(file)).toHaveLength(0);
  });
});

describe('registerJudge/related answerable', () => {
  it('related=yes answerable=no（どちらも閾値以上）→ 促しは出ない', async () => {
    const settings = defaultSettings();
    const { handler, run, file } = wired(settings, [yesNo()], 'live', armedWithTurns(1));
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    const current = run.get();
    if (current.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(current.unrelated).toBe(0);
    expect(current.related).toHaveLength(1);
    expect(current.read).toEqual([]);
    expect(readRecords(file)).toHaveLength(1);
  });

  it('answerable=yes（閾値以上）→ 促しが 1 回出る', async () => {
    const settings = defaultSettings();
    const { handler, run, file } = wired(settings, [yesYes()], 'live', armedWithTurns(1));
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result?.entries).toHaveLength(1);
    const current = run.get();
    if (current.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(current.unrelated).toBe(0);
    expect(readRecords(file)).toHaveLength(1);
    expect(readRecords(file)[0]?.nudge).not.toBeNull();
  });

  it('related=no と yes が交互 → 合計で数えて 2 回目の no で出る', async () => {
    const settings = defaultSettings();
    const { handler, run } = wired(settings, [noNo(), yesNo(), noNo()], 'live', armedWithTurns(1));
    await handler(readTurn(), { cwd: '/repo' });
    const afterFirst = run.get();
    if (afterFirst.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(afterFirst.unrelated).toBe(1);
    await handler(readTurn(), { cwd: '/repo' });
    const afterSecond = run.get();
    if (afterSecond.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(afterSecond.unrelated).toBe(1);
    const result = await handler(readTurn(), { cwd: '/repo' });
    const afterThird = run.get();
    if (afterThird.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(afterThird.unrelated).toBe(2);
    expect(result?.entries).toHaveLength(1);
  });

  it('answerable の confidence が閾値未満 → 促しは出ない', async () => {
    const settings = defaultSettings();
    const low = batchAnswered(choiceAnswer('yes', 0.95), choiceAnswer('yes', 0.79));
    const { handler, run, file } = wired(settings, [low], 'live', armedWithTurns(1));
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    const current = run.get();
    if (current.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(current.unrelated).toBe(0);
    expect(readRecords(file)).toHaveLength(1);
  });

  it('related=yes の往復のあと、次の payload の related にその action が入る', async () => {
    const settings = defaultSettings();
    const { handler, requests } = wired(settings, [yesNo(), yesNo()], 'live', armedWithTurns(1));
    await handler(readTurn(), { cwd: '/repo' });
    await handler(readTurn(), { cwd: '/repo' });
    expect(requests).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽 ask が受けた request の形を読む
    const second = requests[1] as { readonly state: Readonly<Record<string, unknown>> };
    const related = second.state['related'];
    expect(Array.isArray(related)).toBe(true);
    expect(related).toHaveLength(1);
  });

  it('approve の往復 → 2 段目は走らない', async () => {
    const settings = defaultSettings();
    let initial = arm({
      ownerNow: 'hello',
      choice: 'approve',
      confidence: 0.9,
      candidate: CANDIDATE,
      now: 1,
    });
    initial = noteTurn(initial, 'text0', defaultSettings().state);
    const { handler, requests, file } = wired(settings, [noNo()], 'live', initial);
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(0);
    expect(readRecords(file)).toHaveLength(0);
  });

  it('促しの文を差し替えると出す文も変わる', async () => {
    const base = defaultSettings();
    const settings: Settings = {
      ...base,
      judge: { ...base.judge, stop: { ...base.judge.stop, nudge: '独自の促し文' } },
    };
    const { handler } = wired(settings, [yesYes()], 'live', armedWithTurns(1));
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result?.entries[0]?.content).toBe('独自の促し文');
  });
});

describe('registerJudge/state chars', () => {
  it('小さい往復 → judge の記録の state_chars が、渡した payload の JSON の字数と同じ', async () => {
    const settings = defaultSettings();
    const { handler, requests, file } = wired(settings, [noNo()], 'live', armedWithTurns(1));
    await handler(readTurn(), { cwd: '/repo' });
    const records = readRecords(file);
    expect(records).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽 ask が受けた request の形を読む
    const state = (requests[0] as { readonly state: Readonly<Record<string, unknown>> }).state;
    expect(records[0]?.state_chars).toBe(JSON.stringify(state).length);
    expect(records[0]?.truncated).toBe(false);
  });

  it('state が maxStateChars を超える → state_chars が削った後の字数になり、truncated が true', async () => {
    const settings = withMaxStateChars(defaultSettings(), 500);
    let initial = arm({
      ownerNow: 'hello',
      choice: 'reply',
      confidence: 0.9,
      candidate: CANDIDATE,
      now: 1,
    });
    for (let index = 0; index < 4; index += 1) {
      initial = addAction(
        initial,
        toAction(1, 'read', { path: `f${index}.ts` }, 'x'.repeat(100), false, 300),
        defaultSettings().state,
      );
      initial = noteTurn(initial, `text${index}`, defaultSettings().state);
    }
    const { handler, requests, file } = wired(settings, [noNo()], 'live', initial);
    await handler(readTurn(), { cwd: '/repo' });
    const records = readRecords(file);
    expect(records).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽 ask が受けた request の形を読む
    const state = (requests[0] as { readonly state: Readonly<Record<string, unknown>> }).state;
    expect(records[0]?.state_chars).toBe(JSON.stringify(state).length);
    expect(records[0]?.state_chars).toBeLessThanOrEqual(500);
    expect(records[0]?.truncated).toBe(true);
  });

  it('2 問の classify が失敗 → 記録に state_chars と truncated が入る', async () => {
    const settings = defaultSettings();
    const { handler, requests, file } = wired(settings, [batchFailed()], 'live', armedWithTurns(1));
    await handler(readTurn(), { cwd: '/repo' });
    const records = readRecords(file);
    expect(records).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽 ask が受けた request の形を読む
    const state = (requests[0] as { readonly state: Readonly<Record<string, unknown>> }).state;
    expect(records[0]?.state_chars).toBe(JSON.stringify(state).length);
    expect(typeof records[0]?.truncated).toBe('boolean');
  });

  it('促しが出る往復 → nudge の記録にも state_chars と truncated が入る', async () => {
    const settings = defaultSettings();
    const { handler, requests, file } = wired(
      settings,
      [noNo(), noNo()],
      'live',
      armedWithTurns(1),
    );
    await handler(readTurn(), { cwd: '/repo' });
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result?.entries).toHaveLength(1);
    const records = readRecords(file);
    expect(records).toHaveLength(2);
    expect(records[1]?.nudge).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽 ask が受けた request の形を読む
    const state = (requests[1] as { readonly state: Readonly<Record<string, unknown>> }).state;
    expect(records[1]?.state_chars).toBe(JSON.stringify(state).length);
    expect(records[1]?.truncated).toBe(false);
  });
});

describe('registerJudge/integration', () => {
  it('2 往復目で answerable=yes → 促しが 1 回だけ出て記録の nudge に入る', async () => {
    const settings = defaultSettings();
    const { handler, requests, file } = wired(
      settings,
      [yesNo(), yesYes()],
      'live',
      armedWithTurns(1),
    );
    await handler(readTurn(), { cwd: '/repo' });
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result?.entries).toHaveLength(1);
    expect(requests).toHaveLength(2);
    const records = readRecords(file);
    expect(records).toHaveLength(2);
    expect(records[0]?.nudge).toBeNull();
    expect(records[1]?.nudge).not.toBeNull();
  });

  it('shadow では answerable の促しも差し込まず記録だけ残る', async () => {
    const { handler, file } = wired(
      defaultSettings(),
      [yesNo(), yesYes()],
      'shadow',
      armedWithTurns(1),
    );
    await handler(readTurn(), { cwd: '/repo' });
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result).toBeUndefined();
    const records = readRecords(file);
    expect(records).toHaveLength(2);
    expect(records[1]).toMatchObject({ hook: 'judge', fired: false });
    expect(typeof records[1]?.nudge).toBe('string');
  });

  it('3 往復で related=no/yes/no → 合計 2 回で促しが出て、その後は出ない', async () => {
    const settings = defaultSettings();
    const { handler, requests, file } = wired(
      settings,
      [noNo(), yesNo(), noNo(), noNo()],
      'live',
      armedWithTurns(1),
    );
    await handler(readTurn(), { cwd: '/repo' });
    await handler(readTurn(), { cwd: '/repo' });
    const third = await handler(readTurn(), { cwd: '/repo' });
    expect(third?.entries).toHaveLength(1);
    const fourth = await handler(readTurn(), { cwd: '/repo' });
    expect(fourth).toBeUndefined();
    expect(requests).toHaveLength(3);
    expect(readRecords(file)).toHaveLength(3);
  });

  it('ask が 2 回続けて失敗 → 記録は残り促しは出ない', async () => {
    const settings = defaultSettings();
    const { handler, requests, file } = wired(
      settings,
      [batchFailed(), batchFailed()],
      'live',
      armedWithTurns(1),
    );
    const first = await handler(readTurn(), { cwd: '/repo' });
    expect(first).toBeUndefined();
    const second = await handler(readTurn(), { cwd: '/repo' });
    expect(second).toBeUndefined();
    expect(requests).toHaveLength(2);
    const records = readRecords(file);
    expect(records).toHaveLength(2);
    expect(records[0]?.nudge).toBeNull();
    expect(records[1]?.nudge).toBeNull();
  });

  it('related=no かつ answerable=yes → 促しが出て unrelated が 1 増える', async () => {
    const settings = defaultSettings();
    const both = batchAnswered(choiceAnswer('no', 0.95), choiceAnswer('yes', 0.95));
    const { handler, run, file } = wired(settings, [both], 'live', armedWithTurns(1));
    const result = await handler(readTurn(), { cwd: '/repo' });
    expect(result?.entries).toHaveLength(1);
    const current = run.get();
    if (current.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(current.unrelated).toBe(1);
    expect(readRecords(file)).toHaveLength(1);
    expect(readRecords(file)[0]?.nudge).not.toBeNull();
  });

  it('toolCall を含む往復 → payload の agent_text に呼び出しの中身が出ない', async () => {
    const settings = defaultSettings();
    const { handler, requests } = wired(settings, [yesNo(), yesNo()], 'live', armedWithTurns(1));
    await handler(
      {
        turnIndex: 2,
        message: {
          content: [
            { type: 'text', text: 'plain answer here' },
            { type: 'toolCall', id: '1', name: 'read', arguments: { path: 'secret-arg-file.ts' } },
          ],
        },
        toolResults: [
          { toolName: 'read', content: [{ type: 'text', text: 'file body' }], isError: false },
        ],
      },
      { cwd: '/repo' },
    );
    await handler(readTurn(), { cwd: '/repo' });
    expect(requests).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽 ask が受けた request の形を読む
    const second = requests[1] as { readonly state: Readonly<Record<string, unknown>> };
    expect(second.state['agent_text']).toBe('plain answer here');
    expect(String(second.state['agent_text'])).not.toContain('secret-arg-file');
  });

  it('owner_text と agent_text は minimize で詰める', async () => {
    const settings = defaultSettings();
    let initial = arm({
      ownerNow: 'a\n\n b   c',
      choice: 'reply',
      confidence: 0.9,
      candidate: CANDIDATE,
      now: 1,
    });
    initial = noteTurn(initial, 'x\n\n  y', defaultSettings().state);
    const { handler, requests } = wired(settings, [yesNo()], 'live', initial);
    await handler(readTurn(), { cwd: '/repo' });
    expect(requests).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽 ask が受けた request の形を読む
    const first = requests[0] as { readonly state: Readonly<Record<string, unknown>> };
    expect(first.state['owner_text']).toBe('a b c');
    expect(first.state['agent_text']).toBe('x y');
  });
});

describe('registerJudge/new tools', () => {
  it('fetch_content の往復 → read に fetch_content と url が出る', async () => {
    const settings = defaultSettings();
    const { handler, requests } = wired(settings, [yesYes()], 'live', armedWithTurns(1));
    await handler(toolTurn('fetch_content', { url: 'https://x' }, 'body'), { cwd: '/repo' });
    expect(requests).toHaveLength(1);
    expect(readOf(requests[0])).toMatchObject([{ tool: 'fetch_content', target: 'https://x' }]);
  });

  it('codemode の往復 → read に codemode が出る（的は空）', async () => {
    const settings = defaultSettings();
    const { handler, requests } = wired(settings, [yesYes()], 'live', armedWithTurns(1));
    await handler(toolTurn('codemode', { code: '...' }, 'body'), { cwd: '/repo' });
    expect(requests).toHaveLength(1);
    expect(readOf(requests[0])).toMatchObject([{ tool: 'codemode', target: '' }]);
  });

  it('quick_edit の往復 → read に quick_edit と path が出る', async () => {
    const settings = defaultSettings();
    const { handler, requests } = wired(settings, [yesYes()], 'live', armedWithTurns(1));
    await handler(toolTurn('quick_edit', { path: 'a.ts' }, 'body'), { cwd: '/repo' });
    expect(requests).toHaveLength(1);
    expect(readOf(requests[0])).toMatchObject([{ tool: 'quick_edit', target: 'a.ts' }]);
  });

  it('一覧から落ちた edit の往復 → read に入らない', async () => {
    const settings = defaultSettings();
    const { handler, requests } = wired(settings, [yesYes()], 'live', armedWithTurns(1));
    const result = await handler(toolTurn('edit', { path: 'x.ts' }, 'body'), { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(0);
  });
});
