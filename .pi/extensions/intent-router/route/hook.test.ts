import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import type { Answer, Ask, AskOutcome, AskRequest } from '../ask/ask.ts';
import { createRecent, type IntentRecord } from '../record/recent.ts';
import { defaultSettings, type Settings } from '../settings/schema.ts';
import { idleRun, type FlagsPort, type Mode, type Run, type RunPort } from '../state/run.ts';
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

function fakeFlags(mode: Mode): FlagsPort {
  let current = { mode };
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

function wired(
  settings: Settings,
  outcome: AskOutcome,
  mode: Mode,
): {
  readonly handler: Handler;
  readonly run: RunPort;
  readonly requests: AskRequest[];
  readonly dir: string;
  readonly file: string;
} {
  const dir = tmpDir();
  const file = join(dir, 'recent.json');
  const recent = createRecent(50, file);
  const { ask, requests } = fakeAsk(outcome);
  const run = fakeRun();
  const { pi, handler } = fakePi();
  registerRoute(pi, {
    settings,
    ask,
    run,
    flags: fakeFlags(mode),
    log: (record: IntentRecord) => {
      recent.add(record);
    },
  });
  return { handler: handler(), run, requests, dir, file };
}

function readRecords(file: string): IntentRecord[] {
  try {
    const text = readFileSync(file, 'utf8');
    if (text.trim() === '') {
      return [];
    }
    const parsed: unknown = JSON.parse(text);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- recent.json の形を読む
    return Array.isArray(parsed) ? (parsed as IntentRecord[]) : [];
  } catch {
    return [];
  }
}

describe('registerRoute', () => {
  it('expect が reply 0.87 → act で reply の guide が1回だけ差し込まれる（live）', async () => {
    const settings = defaultSettings();
    const { handler, run, file } = wired(settings, answeredOutcome('reply', 0.87), 'live');
    const result = await handler({ prompt: 'this design, what do you think?' }, { cwd: '/repo' });
    expect(result?.message.content).toBe(settings.route.guides.reply);
    expect(run.get().kind).toBe('armed');
    const records = readRecords(file);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'route', choice: 'reply', fired: true });
  });

  it('expect が approve 0.92 → act で approve の guide', async () => {
    const settings = defaultSettings();
    const { handler } = wired(settings, answeredOutcome('approve', 0.92), 'live');
    const result = await handler({ prompt: 'looks good, proceed' }, { cwd: '/repo' });
    expect(result?.message.content).toBe(settings.route.guides.approve);
  });

  it('approve 0.85 → idle（0.9 に届かない）', async () => {
    const settings = defaultSettings();
    const { handler, run, file } = wired(settings, answeredOutcome('approve', 0.85), 'live');
    const result = await handler({ prompt: 'looks good, proceed' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(run.get().kind).toBe('idle');
    const records = readRecords(file);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'route', fired: false });
  });

  it('other → idle（文を出さない）', async () => {
    const settings = defaultSettings();
    const { handler, file } = wired(settings, answeredOutcome('other', 0.9), 'live');
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(readRecords(file)).toHaveLength(1);
  });

  it('classify が失敗 → 記録1行だけ残して何も出さない', async () => {
    const settings = defaultSettings();
    const { handler, run, file } = wired(settings, failedOutcome(), 'live');
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(run.get().kind).toBe('idle');
    expect(readRecords(file)).toHaveLength(1);
  });

  it('セッションに前の発言が無い → agent_prev は空文字', async () => {
    const settings = defaultSettings();
    const { handler, requests } = wired(settings, answeredOutcome('reply', 0.9), 'live');
    await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(requests[0]?.state['agent_prev']).toBe('');
    expect(requests[0]?.state['owner_now']).toBe('hello');
  });

  it('ctx.agentPrev が渡る → routePayload に入る', async () => {
    const settings = defaultSettings();
    const { handler, requests } = wired(settings, answeredOutcome('reply', 0.9), 'live');
    await handler({ prompt: 'hello' }, { cwd: '/repo', agentPrev: 'previous agent text' });
    expect(requests[0]?.state['agent_prev']).toBe('previous agent text');
  });

  it('owner_now が上限より長い → textChars で切れる', async () => {
    const settings = defaultSettings();
    const { handler, requests } = wired(settings, answeredOutcome('reply', 0.9), 'live');
    const limit = settings.state.textChars;
    await handler({ prompt: 'あ'.repeat(limit + 100) }, { cwd: '/repo' });
    expect(String(requests[0]?.state['owner_now']).length).toBe(limit);
  });

  it('前の発言が上限より長い → textChars で切れる', async () => {
    const settings = defaultSettings();
    const { handler, requests } = wired(settings, answeredOutcome('reply', 0.9), 'live');
    const limit = settings.state.textChars;
    await handler({ prompt: 'hello' }, { cwd: '/repo', agentPrev: 'あ'.repeat(limit + 50) });
    expect(String(requests[0]?.state['agent_prev']).length).toBe(limit);
  });

  it('画像つきの発言 → 頭の state に画像を入れない', async () => {
    const settings = defaultSettings();
    const { handler, requests } = wired(settings, answeredOutcome('reply', 0.9), 'live');
    await handler({ prompt: 'hello', images: [{ type: 'image' }] }, { cwd: '/repo' });
    const state = requests[0]?.state ?? {};
    expect(JSON.stringify(state)).not.toContain('data:image');
    expect(state['owner_now']).toBe('hello');
    expect('cwd_basename' in state).toBe(false);
    expect('has_images' in state).toBe(false);
  });

  it('shadow → 差し込まずに記録だけ残る', async () => {
    const settings = defaultSettings();
    const { handler, file } = wired(settings, answeredOutcome('reply', 0.9), 'shadow');
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    const records = readRecords(file);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'route', choice: 'reply', fired: false });
    expect(records[0]?.guide).toBe(settings.route.guides.reply);
  });

  it('live → guide が1回だけ差し込まれる', async () => {
    const settings = defaultSettings();
    const { handler } = wired(settings, answeredOutcome('reply', 0.9), 'live');
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result?.message.content).toBe(settings.route.guides.reply);
  });

  it('shadow でも ask は呼ばれる（記録のため）', async () => {
    const { handler, requests, file } = wired(
      defaultSettings(),
      answeredOutcome('reply', 0.9),
      'shadow',
    );
    const result = await handler({ prompt: 'hello' }, { cwd: '/repo' });
    expect(result).toBeUndefined();
    expect(requests).toHaveLength(1);
    expect(readRecords(file)).toHaveLength(1);
  });

  it('/ で始まる発言 → ask が呼ばれない', async () => {
    const { handler, requests } = wired(defaultSettings(), answeredOutcome('reply', 0.9), 'live');
    await handler({ prompt: '/intent off' }, { cwd: '/repo' });
    expect(requests).toHaveLength(0);
  });
});
