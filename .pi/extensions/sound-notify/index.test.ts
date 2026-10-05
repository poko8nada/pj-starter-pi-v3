/**
 * commit・compact で鳴る音と拡張の入口の配線を、差し替えた鳴らす関数で確かめる。
 *
 * afplay は起動しない。`setPlayer` に記録するだけの関数を渡し、実際に鳴る所をテストから外す。
 * イベントの判定は `handleToolExecutionEnd` / `handleSessionCompact` に直接渡し、
 * pi と ctx は必要な口だけの偽物で足りる。入口の配線は `registerSoundHandlers` に
 * 設定を直接渡し、実 FS の `config.json` に依存させない。
 */

import type { ToolExecutionEndEvent } from '@earendil-works/pi-coding-agent';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import extensionDefault, {
  handleSessionCompact,
  handleToolExecutionEnd,
  parseConfig,
  registerSoundHandlers,
  setPlayer,
  type CtxPort,
  type EntryPiPort,
  type PiPort,
} from './index.ts';

const pi: PiPort = { exec: async () => undefined };
const ctx: CtxPort = { hasUI: true };
const defaultConfig = parseConfig({});

function commitEvent(overrides: Partial<ToolExecutionEndEvent> = {}): ToolExecutionEndEvent {
  return {
    type: 'tool_execution_end',
    toolCallId: 't1',
    toolName: 'bash',
    result: {
      content: [{ type: 'text', text: '[main abc1234] Add feature\n 1 file changed' }],
    },
    isError: false,
    ...overrides,
  };
}

describe('sound-notify.commit', () => {
  const played: string[] = [];
  let restorePlayer: () => void;

  beforeEach(() => {
    played.length = 0;
    restorePlayer = setPlayer(async (_pi, soundName) => {
      played.push(soundName);
    });
  });

  afterEach(() => {
    restorePlayer();
  });

  function run(event: ToolExecutionEndEvent, config = defaultConfig): void {
    handleToolExecutionEnd(pi, ctx, event, config);
  }

  it('bash の結果にコミットの形 → commit の音が 1 回鳴る', () => {
    run(commitEvent());
    expect(played).toEqual(['Pop']);
  });

  it('bash の結果が普通の出力 → 鳴らない', () => {
    run(
      commitEvent({
        result: { content: [{ type: 'text', text: 'ok\n3 passed' }] },
      }),
    );
    expect(played).toEqual([]);
  });

  it('toolName が bash 以外 → 鳴らない', () => {
    run(commitEvent({ toolName: 'read' }));
    expect(played).toEqual([]);
  });

  it('isError が真 → 鳴らない', () => {
    run(commitEvent({ isError: true }));
    expect(played).toEqual([]);
  });

  it('config.json の sounds.commit を別名にする → その名前で鳴る', () => {
    run(commitEvent(), parseConfig({ sounds: { commit: 'Basso' } }));
    expect(played).toEqual(['Basso']);
  });
});

describe('sound-notify.compact', () => {
  const played: string[] = [];
  let restorePlayer: () => void;

  beforeEach(() => {
    played.length = 0;
    restorePlayer = setPlayer(async (_pi, soundName) => {
      played.push(soundName);
    });
  });

  afterEach(() => {
    restorePlayer();
  });

  it('圧縮が終わる → Glass が 1 回鳴る', () => {
    handleSessionCompact(pi, ctx, defaultConfig);
    expect(played).toEqual(['Glass']);
  });

  it('圧縮が終わる → cmux の exec は呼ばれない', async () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    const recordingPi: PiPort = {
      exec: async (command, args) => {
        calls.push({ command, args });
        return undefined;
      },
    };
    handleSessionCompact(recordingPi, ctx, defaultConfig);
    await Promise.resolve();
    expect(calls).toEqual([]);
    expect(played).toEqual(['Glass']);
  });

  it('続けて 2 回呼ぶ → 2 回鳴る', () => {
    handleSessionCompact(pi, ctx, defaultConfig);
    handleSessionCompact(pi, ctx, defaultConfig);
    expect(played).toEqual(['Glass', 'Glass']);
  });

  it('config.json の sounds.compact を別名にする → その名前で鳴る', () => {
    handleSessionCompact(pi, ctx, parseConfig({ sounds: { compact: 'Basso' } }));
    expect(played).toEqual(['Basso']);
  });

  it('config.json の sounds.compact が文字列でない → 既定 Glass に落ちる', () => {
    handleSessionCompact(pi, ctx, parseConfig({ sounds: { compact: 7 } }));
    expect(played).toEqual(['Glass']);
  });

  it('hasUI が false → 鳴らない', () => {
    handleSessionCompact(pi, { hasUI: false }, defaultConfig);
    expect(played).toEqual([]);
  });

  it('enabled が false → 鳴らない', () => {
    handleSessionCompact(pi, ctx, { ...defaultConfig, enabled: false });
    expect(played).toEqual([]);
  });
});

function isHandler(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

describe('sound-notify.entry', () => {
  const played: string[] = [];
  let restorePlayer: () => void;

  beforeEach(() => {
    played.length = 0;
    restorePlayer = setPlayer(async (_pi, soundName) => {
      played.push(soundName);
    });
  });

  afterEach(() => {
    restorePlayer();
  });

  it('session_compact を登録し、session_compact_failed は登録しない', () => {
    const registered: string[] = [];
    const recordingPi: EntryPiPort = {
      on: (...args: unknown[]) => {
        const event = args[0];
        if (typeof event === 'string') {
          registered.push(event);
        }
        return () => undefined;
      },
      exec: async () => undefined,
    };
    extensionDefault(recordingPi);
    expect(registered).toContain('session_compact');
    expect(registered).not.toContain('session_compact_failed');
  });

  it('登録した session_compact ハンドラを呼ぶ → Glass が 1 回鳴る', async () => {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const recordingPi: EntryPiPort = {
      on: (...args: unknown[]) => {
        const [event, handler] = args;
        if (typeof event === 'string' && isHandler(handler)) {
          handlers.set(event, handler);
        }
        return () => undefined;
      },
      exec: async () => undefined,
    };
    registerSoundHandlers(recordingPi, defaultConfig);
    const handler = handlers.get('session_compact');
    expect(handler).toBeDefined();
    await handler?.({}, ctx);
    expect(played).toEqual(['Glass']);
  });
});
