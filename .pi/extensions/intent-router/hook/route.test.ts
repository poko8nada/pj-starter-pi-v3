import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../test/tmp.ts';
import type { Answer, Ask, AskOutcome, AskRequest } from '../classifier.ts';
import { append, type LogRecord } from '../log.ts';
import { defaultSettings, type Settings } from '../settings.ts';
import { idleRun, type FlagsPort, type Run, type RunPort } from '../state.ts';
import {
  decideRoute,
  guideMessage,
  registerRoute,
  type RouteCtx,
  type RoutePiPort,
} from './route.ts';

type Handler = (
  event: { readonly prompt: string; readonly images?: readonly unknown[] },
  ctx: RouteCtx,
) => Promise<
  | {
      readonly message: {
        readonly customType: string;
        readonly content: string;
        readonly display: boolean;
      };
    }
  | undefined
>;

function choiceAnswer(choice: string, confidence: number): Answer {
  return { type: 'choice', choice, probabilities: { [choice]: confidence }, confidence };
}

function answeredOutcome(choice: string, confidence: number): AskOutcome {
  return {
    kind: 'answered',
    provider: 'opencode',
    model: 'jev-1.13-free',
    answer: choiceAnswer(choice, confidence),
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

function fakeRun(): RunPort {
  let current: Run = idleRun();
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

function fakePi(): { readonly pi: RoutePiPort; readonly handler: () => Handler } {
  let captured: Handler | undefined;
  const pi: RoutePiPort = {
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

function withShadow(settings: Settings, shadow: boolean): Settings {
  return { ...settings, route: { ...settings.route, shadow } };
}

function withRouteEnabled(settings: Settings, enabled: boolean): Settings {
  return { ...settings, route: { ...settings.route, enabled } };
}

function withGuideEnabled(settings: Settings, enabled: boolean): Settings {
  return { ...settings, guide: { ...settings.guide, enabled } };
}

function withGuideDisplay(settings: Settings, display: boolean): Settings {
  return { ...settings, guide: { ...settings.guide, display } };
}

function withRouteLabels(
  settings: Settings,
  actOn: Settings['route']['actOn'],
  idleOn: Settings['route']['idleOn'],
): Settings {
  return { ...settings, route: { ...settings.route, actOn, idleOn } };
}

function wired(
  settings: Settings,
  outcome: AskOutcome,
  enabled: boolean,
): {
  readonly handler: Handler;
  readonly run: RunPort;
  readonly requests: AskRequest[];
  readonly dir: string;
} {
  const dir = tmpDir();
  const { ask, requests } = fakeAsk(outcome);
  const run = fakeRun();
  const { pi, handler } = fakePi();
  registerRoute(pi, {
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

describe('decideRoute', () => {
  it('design 0.9 → act', () => {
    const thresholds = defaultSettings().thresholds;
    expect(
      decideRoute(choiceAnswer('design', 0.9), thresholds, ['design'], ['chat']),
    ).toMatchObject({
      kind: 'act',
    });
  });

  it('confidence ちょうど 0.5 → act（閾値は >=）', () => {
    const thresholds = defaultSettings().thresholds;
    expect(
      decideRoute(choiceAnswer('design', 0.5), thresholds, ['design'], ['chat']),
    ).toMatchObject({
      kind: 'act',
    });
  });

  it('confidence 0.49 → idle（閾値の下）', () => {
    const thresholds = defaultSettings().thresholds;
    expect(
      decideRoute(choiceAnswer('design', 0.49), thresholds, ['design'], ['chat']),
    ).toMatchObject({
      kind: 'idle',
    });
  });

  it('chat → idle（動かないラベル）', () => {
    const thresholds = defaultSettings().thresholds;
    expect(decideRoute(choiceAnswer('chat', 0.9), thresholds, ['design'], ['chat'])).toMatchObject({
      kind: 'idle',
    });
  });

  it('actOn にも idleOn にも無いラベル → skip', () => {
    const thresholds = defaultSettings().thresholds;
    expect(
      decideRoute(choiceAnswer('design', 0.9), thresholds, ['question'], ['chat']),
    ).toMatchObject({
      kind: 'skip',
    });
  });

  it('score の答え → skip', () => {
    const thresholds = defaultSettings().thresholds;
    expect(
      decideRoute({ type: 'score', score: 1.8, confidence: 0.9 }, thresholds, ['design'], ['chat']),
    ).toMatchObject({ kind: 'skip' });
  });

  it('知らないラベル文字列 → skip', () => {
    const thresholds = defaultSettings().thresholds;
    expect(decideRoute(choiceAnswer('weird', 0.9), thresholds, ['design'], ['chat'])).toMatchObject(
      { kind: 'skip' },
    );
  });
});

describe('guideMessage', () => {
  it('{prompt} と {label} を埋める', () => {
    expect(guideMessage('Re: {prompt} — kind: {label}.', 'design', 'この設計どう思う')).toBe(
      'Re: この設計どう思う — kind: design.',
    );
  });

  it('改行を潰して 40 字まで', () => {
    expect(guideMessage('{prompt}', 'question', 'a\nb')).toBe('a b');
    expect(guideMessage('{prompt}', 'question', 'あ'.repeat(50)).length).toBe(40);
  });
});

describe('registerRoute', () => {
  it('design 0.9 → guide の文を一字一句そのまま返す', async () => {
    const { handler } = wired(
      withShadow(defaultSettings(), false),
      answeredOutcome('design', 0.9),
      true,
    );
    const result = await handler({ prompt: 'この設計どう思う' }, { cwd: '/repo' });
    expect(result?.message.content).toBe(
      'Re: この設計どう思う — kind: design. The owner wants an answer, not an edit. Do not edit, write, delete, or commit anything. Investigate only what the answer needs, then answer.',
    );
  });

  it('confidence 0.49 → undefined で run は idle', async () => {
    const { handler, run } = wired(
      withShadow(defaultSettings(), false),
      answeredOutcome('design', 0.49),
      true,
    );
    const result = await handler({ prompt: 'この設計どう思う' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(run.get().kind).toBe('idle');
  });

  it('flags が off → ask が呼ばれない', async () => {
    const { handler, requests, dir } = wired(
      defaultSettings(),
      answeredOutcome('design', 0.9),
      false,
    );
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(0);
    expect(readRecords(dir)).toHaveLength(0);
  });

  it('settings.route.enabled が false → ask が呼ばれない', async () => {
    const { handler, requests } = wired(
      withRouteEnabled(defaultSettings(), false),
      answeredOutcome('design', 0.9),
      true,
    );
    await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(requests).toHaveLength(0);
  });

  it('/ で始まる発言 → ask が呼ばれない', async () => {
    const { handler, requests } = wired(defaultSettings(), answeredOutcome('design', 0.9), true);
    await handler({ prompt: '/intent off' }, { cwd: '/repo' });
    expect(requests).toHaveLength(0);
  });

  it('ask が failed → undefined で run は idle、ログは idle・label null・failed', async () => {
    const { handler, run, dir } = wired(
      withShadow(defaultSettings(), false),
      failedOutcome(),
      true,
    );
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(run.get().kind).toBe('idle');
    const records = readRecords(dir);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'route', decision: 'idle', label: null });
    if (records[0]?.hook === 'route') {
      expect(records[0].outcome).toMatchObject({ kind: 'failed' });
    }
  });

  it('shadow: true で act → undefined でログの guide が would、text に文面', async () => {
    const { handler, dir } = wired(defaultSettings(), answeredOutcome('design', 0.9), true);
    const result = await handler({ prompt: 'この設計どう思う' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    const records = readRecords(dir);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'route', decision: 'act', guide: 'would' });
    if (records[0]?.hook === 'route') {
      expect(records[0].text).toContain('kind: design');
    }
  });

  it('2回目の発言 → prompt が入れ替わり actions が空、state も入れ替わる', async () => {
    const { handler, run, requests } = wired(
      withShadow(defaultSettings(), false),
      answeredOutcome('question', 0.9),
      true,
    );
    await handler({ prompt: 'first' }, { cwd: '/repo' });
    await handler({ prompt: 'second' }, { cwd: '/repo' });
    const current = run.get();
    if (current.kind !== 'armed') {
      throw new Error('must be armed');
    }
    expect(current.prompt).toBe('second');
    expect(current.actions).toEqual([]);
    expect(requests).toHaveLength(2);
    expect(requests[1]?.state['owner_prompt']).toBe('second');
  });

  it('ctx.cwd が routeState の cwd_basename に入る', async () => {
    const { handler, requests } = wired(
      withShadow(defaultSettings(), false),
      answeredOutcome('question', 0.9),
      true,
    );
    await handler({ prompt: 'hello' }, { cwd: '/work/repo' });
    expect(requests[0]?.state['cwd_basename']).toBe('repo');
  });

  it('どちらの一覧にも無いラベル → undefined でログは skip', async () => {
    const settings = withRouteLabels(withShadow(defaultSettings(), false), ['question'], ['chat']);
    const { handler, run, dir } = wired(settings, answeredOutcome('design', 0.9), true);
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(run.get().kind).toBe('idle');
    const records = readRecords(dir);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'route', decision: 'skip', label: 'design' });
  });

  it('知らないラベル文字列の答え → undefined でログは skip・label null', async () => {
    const outcome: AskOutcome = {
      kind: 'answered',
      provider: 'opencode',
      model: 'jev-1.13-free',
      answer: { type: 'choice', choice: 'weird', probabilities: { weird: 0.9 }, confidence: 0.9 },
      usage: { input: 1, output: 0, cost: 0 },
      latencyMs: 5,
    };
    const { handler, dir } = wired(withShadow(defaultSettings(), false), outcome, true);
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    const records = readRecords(dir);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'route', decision: 'skip', label: null });
  });

  it('guide.enabled が false → act でも文を返さずログの guide が none', async () => {
    const settings = withGuideEnabled(withShadow(defaultSettings(), false), false);
    const { handler, dir } = wired(settings, answeredOutcome('design', 0.9), true);
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    const records = readRecords(dir);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'route', decision: 'act', guide: 'none', text: null });
  });

  it('画像つきの発言 → state の has_images が true', async () => {
    const { handler, requests } = wired(
      withShadow(defaultSettings(), false),
      answeredOutcome('question', 0.9),
      true,
    );
    await handler({ prompt: 'hello', images: [{ type: 'image' }] }, { cwd: '/repo' });
    expect(requests[0]?.state['has_images']).toBe(true);
  });

  it('2000 字超の発言 → ログの truncated が true', async () => {
    const { handler, dir } = wired(
      withShadow(defaultSettings(), false),
      answeredOutcome('question', 0.9),
      true,
    );
    await handler({ prompt: 'あ'.repeat(2500) }, { cwd: '/repo' });
    const records = readRecords(dir);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'route', truncated: true });
  });

  it('guide.display が false → 返す文の display が false', async () => {
    const { handler } = wired(
      withGuideDisplay(withShadow(defaultSettings(), false), false),
      answeredOutcome('design', 0.9),
      true,
    );
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result?.message.display).toBe(false);
  });
});
