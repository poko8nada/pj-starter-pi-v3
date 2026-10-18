import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { tmpDir } from '../../../test/tmp.ts';
import type { RegistryModel } from './ask/ask.ts';
import { register } from './index.ts';
import type { IntentRecord } from './record/recent.ts';
import { defaultSettings } from './settings/schema.ts';

type AnyHandler = (event: unknown, ctx: unknown) => Promise<unknown>;

function recentFile(cwd: string): string {
  return join(cwd, '.pi/extensions/intent-router/logs/recent.json');
}

function fakePi(): {
  readonly events: string[];
  readonly handlers: Map<string, AnyHandler>;
  readonly commands: Map<string, (args: string, ctx: unknown) => void>;
  readonly api: ExtensionAPI;
} {
  const events: string[] = [];
  const handlers = new Map<string, AnyHandler>();
  const commands = new Map<string, (args: string, ctx: unknown) => void>();
  const api = {
    on: (event: string, handler: AnyHandler) => {
      events.push(event);
      handlers.set(event, handler);
    },
    registerCommand: (
      name: string,
      options: { readonly handler: (args: string, ctx: unknown) => void },
    ) => {
      commands.set(name, options.handler);
    },
  };
  return {
    events,
    handlers,
    commands,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽物は使う口だけ持つ
    api: api as unknown as ExtensionAPI,
  };
}

function classifierModel(inputCost: number): RegistryModel {
  return {
    id: 'jev-1.13-free',
    name: 'jev-1.13-free',
    api: 'typesafe-system-one',
    provider: 'opencode',
    baseUrl: '',
    input: ['text'],
    cost: { input: inputCost, output: 0, cacheRead: 0, cacheWrite: 0 },
    type: 'classifier',
    contextWindow: 10000,
  };
}

function usage() {
  return {
    input: 5,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 5,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

function answeringRegistry(model: RegistryModel, reused?: RegistryModel, targets?: string[]) {
  const only = reused ?? model;
  return {
    getAvailableOfType: (): Promise<RegistryModel[]> => Promise.resolve([model]),
    findOfType: (): RegistryModel | undefined => only,
    classify: (
      target: RegistryModel,
      context: { readonly questions: Readonly<Record<string, unknown>> },
    ) => {
      targets?.push(target.id);
      if ('expect' in context.questions || 'route' in context.questions) {
        return Promise.resolve({
          stopReason: 'stop',
          answers: {
            expect: {
              type: 'choice',
              choice: 'reply',
              probabilities: { reply: 0.9 },
              confidence: 0.9,
            },
          },
          usage: usage(),
        });
      }
      return Promise.resolve({
        stopReason: 'stop',
        answers: {
          useful: {
            type: 'choice',
            choice: 'yes',
            probabilities: { yes: 0.9 },
            confidence: 0.9,
          },
          new: {
            type: 'choice',
            choice: 'yes',
            probabilities: { yes: 0.9 },
            confidence: 0.9,
          },
        },
        usage: usage(),
      });
    },
  };
}

function fakeCtx(cwd: string, registry: unknown, notifies: string[], entries: unknown[] = []) {
  return {
    cwd,
    modelRegistry: registry,
    sessionManager: {
      buildContextEntries: () => entries,
    },
    ui: {
      notify: (message: string) => {
        notifies.push(message);
      },
    },
  };
}

function writeSettings(cwd: string, text: string): void {
  const dir = join(cwd, '.pi/extensions/intent-router');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'settings.json'), text);
}

function isRecord(value: unknown): value is IntentRecord {
  return typeof value === 'object' && value !== null && 'hook' in value && 'at' in value;
}

function readRecords(cwd: string): IntentRecord[] {
  try {
    const text = readFileSync(recentFile(cwd), 'utf8');
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
        if (isRecord(parsed)) {
          out.push(parsed);
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

function readTurn(): {
  readonly turnIndex: number;
  readonly message: object;
  readonly toolResults: object[];
} {
  return {
    turnIndex: 0,
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

describe('register', () => {
  it('before_agent_start が先、turn_end が後、intent コマンドが1つ', () => {
    const fake = fakePi();
    register(fake.api, { cwd: tmpDir() });
    expect(fake.events[0]).toBe('before_agent_start');
    expect(fake.events[1]).toBe('turn_end');
    expect([...fake.commands.keys()]).toEqual(['intent']);
  });

  it('before_agent_start → turn_end で route と judge の2行が出る（1本の配線）', async () => {
    const cwd = tmpDir();
    writeSettings(cwd, JSON.stringify({ judge: { minTurns: 1 } }));
    const fake = fakePi();
    register(fake.api, { cwd });
    const notifies: string[] = [];
    const ctx = fakeCtx(cwd, answeringRegistry(classifierModel(0)), notifies);
    const prompt = 'cycles/013-2026-10-09/design.md は何を決めた?';
    await fake.handlers.get('before_agent_start')?.({ prompt, images: [] }, ctx);
    await fake.handlers.get('turn_end')?.(readTurn(), ctx);
    const records = readRecords(cwd);
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ hook: 'route' });
    expect(records[1]).toMatchObject({ hook: 'judge' });
    if (records[0]?.hook === 'route' && records[1]?.hook === 'judge') {
      expect(records[1].owner_now).toBe(records[0].owner_now);
    }
  });

  it('セッションの最後の発言がエージェントの物 → agent_prev に入る（偽の ctx）', async () => {
    const cwd = tmpDir();
    const fake = fakePi();
    register(fake.api, { cwd });
    const notifies: string[] = [];
    const seen: unknown[] = [];
    const registry = {
      getAvailableOfType: (): Promise<RegistryModel[]> => Promise.resolve([classifierModel(0)]),
      findOfType: (): RegistryModel | undefined => classifierModel(0),
      classify: (
        _target: RegistryModel,
        context: { readonly state: Readonly<Record<string, unknown>> },
      ) => {
        seen.push(context.state);
        return Promise.resolve({
          stopReason: 'stop',
          answers: {
            expect: {
              type: 'choice',
              choice: 'reply',
              probabilities: { reply: 0.9 },
              confidence: 0.9,
            },
          },
          usage: usage(),
        });
      },
    };
    const ctx = fakeCtx(cwd, registry, notifies, [
      { type: 'message', message: { role: 'user', content: 'hello' } },
      { type: 'message', message: { role: 'assistant', content: 'previous agent text' } },
    ]);
    await fake.handlers.get('before_agent_start')?.({ prompt: 'hello' }, ctx);
    expect(seen[0]).toMatchObject({ agent_prev: 'previous agent text' });
  });

  it('壊れた settings.json → 投げる（黙って既定で走らない）', () => {
    const cwd = tmpDir();
    writeSettings(cwd, '{');
    const fake = fakePi();
    expect(() => register(fake.api, { cwd })).toThrow(/not valid JSON/);
  });

  it('settings.json が無い → 既定で登録できる', () => {
    const fake = fakePi();
    const wiring = register(fake.api, { cwd: tmpDir() });
    expect(wiring.settings).toEqual(defaultSettings());
  });

  it('route.shadow と judge.shadow が両方 false → 初期 mode は live', () => {
    const cwd = tmpDir();
    writeSettings(cwd, JSON.stringify({ route: { shadow: false }, judge: { shadow: false } }));
    const fake = fakePi();
    expect(register(fake.api, { cwd }).flags.mode).toBe('live');
  });

  it('片方でも shadow なら初期 mode は shadow', () => {
    const first = tmpDir();
    writeSettings(first, JSON.stringify({ route: { shadow: true }, judge: { shadow: false } }));
    expect(register(fakePi().api, { cwd: first }).flags.mode).toBe('shadow');
    const second = tmpDir();
    writeSettings(second, JSON.stringify({ route: { shadow: false }, judge: { shadow: true } }));
    expect(register(fakePi().api, { cwd: second }).flags.mode).toBe('shadow');
  });

  it('settings.json が無い → 初期 mode は shadow（既定）', () => {
    const fake = fakePi();
    expect(register(fake.api, { cwd: tmpDir() }).flags.mode).toBe('shadow');
  });

  it('judge は route が選んだ候補を使い回す（only）', async () => {
    const cwd = tmpDir();
    writeSettings(cwd, JSON.stringify({ judge: { minTurns: 1 } }));
    const reused = { ...classifierModel(0), id: 'jev-1.13-reused' };
    const targets: string[] = [];
    const fake = fakePi();
    register(fake.api, { cwd });
    const notifies: string[] = [];
    const ctx = fakeCtx(cwd, answeringRegistry(classifierModel(0), reused, targets), notifies);
    await fake.handlers.get('before_agent_start')?.({ prompt: 'hello' }, ctx);
    await fake.handlers.get('turn_end')?.(readTurn(), ctx);
    expect(targets).toEqual(['jev-1.13-free', 'jev-1.13-reused']);
    expect(readRecords(cwd)).toHaveLength(2);
  });

  it('有料の候補で答えた時、ui.notify が1回呼ばれる', async () => {
    const cwd = tmpDir();
    const fake = fakePi();
    register(fake.api, { cwd });
    const notifies: string[] = [];
    const ctx = fakeCtx(cwd, answeringRegistry(classifierModel(1)), notifies);
    await fake.handlers.get('before_agent_start')?.({ prompt: 'hello' }, ctx);
    expect(notifies).toHaveLength(1);
    expect(notifies[0]).toMatch(/paid/);
  });

  it('set が書いた値を次の ask が読む', async () => {
    const cwd = tmpDir();
    const fake = fakePi();
    register(fake.api, { cwd });
    const notifies: string[] = [];
    const seen: unknown[] = [];
    const registry = {
      getAvailableOfType: (): Promise<RegistryModel[]> => Promise.resolve([classifierModel(0)]),
      findOfType: (): RegistryModel | undefined => classifierModel(0),
      classify: (
        _target: RegistryModel,
        context: { readonly state: Readonly<Record<string, unknown>> },
      ) => {
        seen.push(context.state);
        return Promise.resolve({
          stopReason: 'stop',
          answers: {
            expect: {
              type: 'choice',
              choice: 'approve',
              probabilities: { approve: 0.75 },
              confidence: 0.75,
            },
          },
          usage: usage(),
        });
      },
    };
    const ctx = fakeCtx(cwd, registry, notifies);
    await fake.handlers.get('before_agent_start')?.({ prompt: 'hello' }, ctx);
    expect(readRecords(cwd)).toHaveLength(1);
    expect(readRecords(cwd)[0]).toMatchObject({ hook: 'route', choice: 'approve' });
    expect(readRecords(cwd)[0]?.guide).toBeNull();
    const intentHandler = fake.commands.get('intent');
    if (intentHandler === undefined) {
      throw new Error('intent command was not registered');
    }
    intentHandler('set route.thresholds.approve 0.7', { ui: { notify: () => {} } });
    await fake.handlers.get('before_agent_start')?.({ prompt: 'hello' }, ctx);
    expect(readRecords(cwd)).toHaveLength(2);
    expect(readRecords(cwd)[1]).toMatchObject({ hook: 'route', choice: 'approve' });
    expect(readRecords(cwd)[1]?.guide).toBe(
      defaultSettings().route.guides.approve.split('{prompt}').join('hello'),
    );
  });
});
