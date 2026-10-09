import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { tmpDir } from '../../test/tmp.ts';
import type { RegistryModel } from './classifier.ts';
import { register } from './index.ts';
import type { LogRecord } from './log.ts';
import { defaultSettings } from './settings.ts';

type AnyHandler = (event: unknown, ctx: unknown) => Promise<unknown>;

function fakePi(): {
  readonly events: string[];
  readonly handlers: Map<string, AnyHandler>;
  readonly commands: string[];
  readonly api: ExtensionAPI;
} {
  const events: string[] = [];
  const handlers = new Map<string, AnyHandler>();
  const commands: string[] = [];
  const api = {
    on: (event: string, handler: AnyHandler) => {
      events.push(event);
      handlers.set(event, handler);
    },
    registerCommand: (name: string, _options: unknown) => {
      commands.push(name);
      void _options;
    },
  };
  return {
    events,
    handlers,
    commands,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽物は使う3口だけ持つ
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

function answeringRegistry(model: RegistryModel) {
  return {
    getAvailableOfType: (): Promise<RegistryModel[]> => Promise.resolve([model]),
    findOfType: (): RegistryModel | undefined => model,
    classify: (
      _target: RegistryModel,
      context: { readonly questions: Readonly<Record<string, unknown>> },
    ) => {
      if ('route' in context.questions) {
        return Promise.resolve({
          stopReason: 'stop',
          answers: {
            route: {
              type: 'choice',
              choice: 'question',
              probabilities: { question: 0.9 },
              confidence: 0.9,
            },
          },
          usage: usage(),
        });
      }
      return Promise.resolve({
        stopReason: 'stop',
        answers: { judge: { type: 'score', score: 1.8, confidence: 0.8 } },
        usage: usage(),
      });
    },
  };
}

function fakeCtx(cwd: string, registry: unknown, notifies: string[]) {
  return {
    cwd,
    modelRegistry: registry,
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

function dayName(at: Date): string {
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}.jsonl`;
}

function daysAgo(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() - days, 12, 0, 0);
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
  it('before_agent_start が先、turn_end が後、session_start が1つ、intent コマンドが1つ', () => {
    const fake = fakePi();
    register(fake.api, { cwd: tmpDir() });
    expect(fake.events[0]).toBe('before_agent_start');
    expect(fake.events[1]).toBe('turn_end');
    expect(fake.events.filter((event) => event === 'session_start')).toHaveLength(1);
    expect(fake.commands).toEqual(['intent']);
  });

  it('15日前のログだけが消える（整備の結線）', async () => {
    const cwd = tmpDir();
    const logs = join(cwd, 'logs');
    writeSettings(cwd, JSON.stringify({ log: { dir: logs } }));
    mkdirSync(logs, { recursive: true });
    const now = new Date();
    writeFileSync(join(logs, dayName(daysAgo(now, 15))), '{}\n');
    writeFileSync(join(logs, dayName(now)), '{}\n');
    const fake = fakePi();
    register(fake.api, { cwd });
    await fake.handlers.get('session_start')?.({}, fakeCtx(cwd, null, []));
    expect(readdirSync(logs).toSorted()).toEqual([dayName(now)]);
  });

  it('before_agent_start → turn_end で route と judge の2行が出る（1本の配線）', async () => {
    const cwd = tmpDir();
    const logs = join(cwd, 'logs');
    writeSettings(cwd, JSON.stringify({ judge: { minTurns: 1 }, log: { dir: logs } }));
    const fake = fakePi();
    register(fake.api, { cwd });
    const notifies: string[] = [];
    const ctx = fakeCtx(cwd, answeringRegistry(classifierModel(0)), notifies);
    const prompt = 'cycles/013-2026-10-09/design.md は何を決めた?';
    await fake.handlers.get('before_agent_start')?.({ prompt, images: [] }, ctx);
    await fake.handlers.get('turn_end')?.(readTurn(), ctx);
    const records = readRecords(logs);
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ hook: 'route' });
    expect(records[1]).toMatchObject({ hook: 'judge' });
    if (records[0]?.hook === 'route' && records[1]?.hook === 'judge') {
      expect(records[1].owner_prompt).toBe(records[0].owner_prompt);
    }
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
});
