import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import type { Answer, Ask, AskOutcome, AskRequest } from '../ask/ask.ts';
import { append, type LogRecord } from '../record/recent.ts';
import { defaultSettings, type Settings } from '../settings/schema.ts';
import { idleRun, type FlagsPort, type Run, type RunPort } from '../state/run.ts';
import { registerRoute, type RouteCtx, type RoutePiPort } from './hook.ts';

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

describe('registerRoute', () => {
  it('expect が reply 0.87 → act で reply の guide が1回だけ差し込まれる（live）', async () => {
    const settings = withShadow(defaultSettings(), false);
    const { handler, run, dir } = wired(settings, answeredOutcome('reply', 0.87), true);
    const result = await handler({ prompt: 'this design, what do you think?' }, { cwd: '/repo' });
    expect(result?.message.content).toBe(settings.route.guides.reply);
    expect(run.get().kind).toBe('armed');
    expect(readRecords(dir)).toHaveLength(1);
  });

  it('expect が approve 0.92 → act で approve の guide', async () => {
    const settings = withShadow(defaultSettings(), false);
    const { handler } = wired(settings, answeredOutcome('approve', 0.92), true);
    const result = await handler({ prompt: 'looks good, proceed' }, { cwd: '/repo' });
    expect(result?.message.content).toBe(settings.route.guides.approve);
  });

  it('approve 0.85 → idle（0.9 に届かない）', async () => {
    const settings = withShadow(defaultSettings(), false);
    const { handler, run, dir } = wired(settings, answeredOutcome('approve', 0.85), true);
    const result = await handler({ prompt: 'looks good, proceed' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(run.get().kind).toBe('idle');
    expect(readRecords(dir)).toHaveLength(1);
  });

  it('other → idle（文を出さない）', async () => {
    const settings = withShadow(defaultSettings(), false);
    const { handler, dir } = wired(settings, answeredOutcome('other', 0.9), true);
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(readRecords(dir)).toHaveLength(1);
  });

  it('classify が失敗 → 記録1行だけ残して何も出さない', async () => {
    const settings = withShadow(defaultSettings(), false);
    const { handler, run, dir } = wired(settings, failedOutcome(), true);
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(run.get().kind).toBe('idle');
    expect(readRecords(dir)).toHaveLength(1);
  });

  it('セッションに前の発言が無い → agent_prev は空文字', async () => {
    const settings = withShadow(defaultSettings(), false);
    const { handler, requests } = wired(settings, answeredOutcome('reply', 0.9), true);
    await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(requests[0]?.state['agent_prev']).toBe('');
    expect(requests[0]?.state['owner_now']).toBe('hello');
  });

  it('ctx.agentPrev が渡る → routePayload に入る', async () => {
    const settings = withShadow(defaultSettings(), false);
    const { handler, requests } = wired(settings, answeredOutcome('reply', 0.9), true);
    await handler({ prompt: 'hello' }, { cwd: '/repo', agentPrev: 'previous agent text' });
    expect(requests[0]?.state['agent_prev']).toBe('previous agent text');
  });

  it('owner_now が上限より長い → textChars で切れる', async () => {
    const settings = withShadow(defaultSettings(), false);
    const { handler, requests } = wired(settings, answeredOutcome('reply', 0.9), true);
    const limit = settings.state.textChars;
    await handler({ prompt: 'あ'.repeat(limit + 100) }, { cwd: '/repo' });
    expect(String(requests[0]?.state['owner_now']).length).toBe(limit);
  });

  it('前の発言が上限より長い → textChars で切れる', async () => {
    const settings = withShadow(defaultSettings(), false);
    const { handler, requests } = wired(settings, answeredOutcome('reply', 0.9), true);
    const limit = settings.state.textChars;
    await handler({ prompt: 'hello' }, { cwd: '/repo', agentPrev: 'あ'.repeat(limit + 50) });
    expect(String(requests[0]?.state['agent_prev']).length).toBe(limit);
  });

  it('画像つきの発言 → 頭の state に画像を入れない', async () => {
    const settings = withShadow(defaultSettings(), false);
    const { handler, requests } = wired(settings, answeredOutcome('reply', 0.9), true);
    await handler({ prompt: 'hello', images: [{ type: 'image' }] }, { cwd: '/repo' });
    const state = requests[0]?.state ?? {};
    expect(JSON.stringify(state)).not.toContain('data:image');
    expect(state['owner_now']).toBe('hello');
    expect('cwd_basename' in state).toBe(false);
    expect('has_images' in state).toBe(false);
  });

  it('shadow → 差し込まずに記録だけ残る', async () => {
    const { handler, dir } = wired(defaultSettings(), answeredOutcome('reply', 0.9), true);
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    const records = readRecords(dir);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'route', guide: 'would' });
  });

  it('live → guide が1回だけ差し込まれる', async () => {
    const settings = withShadow(defaultSettings(), false);
    const { handler } = wired(settings, answeredOutcome('reply', 0.9), true);
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result?.message.content).toBe(settings.route.guides.reply);
  });

  it('flags が off → ask が呼ばれない', async () => {
    const { handler, requests, dir } = wired(
      defaultSettings(),
      answeredOutcome('reply', 0.9),
      false,
    );
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(0);
    expect(readRecords(dir)).toHaveLength(0);
  });

  it('/ で始まる発言 → ask が呼ばれない', async () => {
    const { handler, requests } = wired(defaultSettings(), answeredOutcome('reply', 0.9), true);
    await handler({ prompt: '/intent off' }, { cwd: '/repo' });
    expect(requests).toHaveLength(0);
  });
});
