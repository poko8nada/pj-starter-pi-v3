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
  isCommitResult,
  parseConfig,
  registerSoundHandlers,
  setPlayer,
  type CtxPort,
  type EntryPiPort,
  type PiPort,
} from './index.ts';

const CMUX_COMMAND = 'cmux';
const CMUX_NOTIFY = 'notify';
const CMUX_FLAG_TITLE = '--title';
const CMUX_FLAG_SUBTITLE = '--subtitle';
const CMUX_FLAG_BODY = '--body';

const CUSTOM_SOUND = 'Basso';
const PERMISSION_TITLE = 'Permission Required';
const QUESTION_TITLE = 'Which one?';

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

function isHandler(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

function createEntry(config = defaultConfig): {
  handlers: Map<string, (...args: unknown[]) => unknown>;
  calls: Array<{ command: string; args: string[] }>;
} {
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  const calls: Array<{ command: string; args: string[] }> = [];
  const recordingPi: EntryPiPort = {
    on: (...args: unknown[]) => {
      const [event, handler] = args;
      if (typeof event === 'string' && isHandler(handler)) {
        handlers.set(event, handler);
      }
      return () => undefined;
    },
    exec: async (command: string, args: string[]) => {
      calls.push({ command, args });
      return undefined;
    },
  };
  registerSoundHandlers(recordingPi, config);
  return { handlers, calls };
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

  it('bash の結果にコミットの形 → commit の音が 1 回鳴り、6 桁では鳴らない', () => {
    run(commitEvent());
    expect(played).toEqual([defaultConfig.sounds.commit]);
    played.length = 0;
    run(
      commitEvent({
        result: { content: [{ type: 'text', text: '[main abc123] short' }] },
      }),
    );
    expect(played).toEqual([]);
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

  it('sounds.commit を別名にする → その名前で鳴る', () => {
    run(commitEvent(), parseConfig({ sounds: { commit: CUSTOM_SOUND } }));
    expect(played).toEqual([CUSTOM_SOUND]);
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

  it('圧縮が終わる → compact の音が 1 回鳴る', () => {
    handleSessionCompact(pi, ctx, defaultConfig);
    expect(played).toEqual([defaultConfig.sounds.compact]);
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
    expect(played).toEqual([defaultConfig.sounds.compact]);
  });

  it('sounds.compact を別名にする → その名前で鳴る', () => {
    handleSessionCompact(pi, ctx, parseConfig({ sounds: { compact: CUSTOM_SOUND } }));
    expect(played).toEqual([CUSTOM_SOUND]);
  });

  it('sounds.compact が文字列でない → 既定に落ちる', () => {
    handleSessionCompact(pi, ctx, parseConfig({ sounds: { compact: 7 } }));
    expect(played).toEqual([defaultConfig.sounds.compact]);
  });
});

describe('sound-notify.guard', () => {
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

  it('hasUI が false → commit でも compact でも鳴らない', () => {
    const noUI: CtxPort = { hasUI: false };
    handleToolExecutionEnd(pi, noUI, commitEvent(), defaultConfig);
    handleSessionCompact(pi, noUI, defaultConfig);
    expect(played).toEqual([]);
  });

  it('enabled が false → commit でも compact でも鳴らない', () => {
    const disabled = { ...defaultConfig, enabled: false };
    handleToolExecutionEnd(pi, ctx, commitEvent(), disabled);
    handleSessionCompact(pi, ctx, disabled);
    expect(played).toEqual([]);
  });
});

describe('sound-notify.prompt', () => {
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

  it('title が permission を含む → permission の音が鳴る', async () => {
    const { handlers } = createEntry(defaultConfig);
    await handlers.get('ui_prompt_start')?.({ title: PERMISSION_TITLE }, ctx);
    expect(played).toEqual([defaultConfig.sounds.permission]);
  });

  it('普通の質問 → question の音が鳴る', async () => {
    const { handlers } = createEntry(defaultConfig);
    await handlers.get('ui_prompt_start')?.({ title: QUESTION_TITLE }, ctx);
    expect(played).toEqual([defaultConfig.sounds.question]);
  });

  it('agent_settled → done の音と cmux の通知', async () => {
    const { handlers, calls } = createEntry(defaultConfig);
    await handlers.get('agent_settled')?.({}, ctx);
    expect(played).toEqual([defaultConfig.sounds.done]);
    expect(
      calls.some(
        (call) =>
          call.command === CMUX_COMMAND &&
          call.args.includes(CMUX_NOTIFY) &&
          call.args.includes(CMUX_FLAG_TITLE) &&
          call.args.includes(CMUX_FLAG_SUBTITLE) &&
          call.args.includes(CMUX_FLAG_BODY),
      ),
    ).toBe(true);
  });

  it('notifications が false → 音は鳴り、cmux を呼ばない', async () => {
    const config = parseConfig({ notifications: false });
    const { handlers, calls } = createEntry(config);
    await handlers.get('agent_settled')?.({}, ctx);
    expect(played).toEqual([defaultConfig.sounds.done]);
    expect(calls).toEqual([]);
  });

  it('permission の合図と普通の質問 → 通知の文面が違う', async () => {
    const { handlers, calls } = createEntry(defaultConfig);
    await handlers.get('ui_prompt_start')?.({ title: PERMISSION_TITLE }, ctx);
    await handlers.get('ui_prompt_start')?.({ title: QUESTION_TITLE }, ctx);
    const bodies = calls.map((call) => call.args[call.args.indexOf(CMUX_FLAG_BODY) + 1]);
    expect(bodies.length).toBe(2);
    expect(bodies[0]).not.toBe(bodies[1]);
  });
});

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

  it('session_compact を登録し、そのハンドラを呼ぶ → compact が 1 回鳴る', async () => {
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
    extensionDefault(recordingPi);
    const handler = handlers.get('session_compact');
    expect(handler).toBeDefined();
    await handler?.({}, ctx);
    expect(played).toEqual([defaultConfig.sounds.compact]);
  });
});

describe('parseConfig', () => {
  it('enabled の true と false、notifications の false を読む', () => {
    expect(parseConfig({ enabled: true }).enabled).toBe(true);
    expect(parseConfig({ enabled: false }).enabled).toBe(false);
    expect(parseConfig({ notifications: false }).notifications).toBe(false);
  });

  it('enabled が真偽値でなければ既定に落ちる', () => {
    expect(parseConfig({ enabled: 'yes' }).enabled).toBe(defaultConfig.enabled);
  });
});

describe('isCommitResult', () => {
  it('文字列の result も見る', () => {
    const text = '[main abc1234] Add feature';
    expect(isCommitResult(commitEvent({ result: text }).result)).toBe(true);
  });

  it('content の text パートも見る', () => {
    expect(isCommitResult(commitEvent().result)).toBe(true);
  });

  it('record でなければ false（落ちない）', () => {
    expect(isCommitResult(commitEvent({ result: undefined }).result)).toBe(false);
    expect(isCommitResult(commitEvent({ result: {} }).result)).toBe(false);
  });
});
