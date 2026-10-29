/**
 * commit・compact で鳴る音と拡張の入口の配線を、差し替えた鳴らす関数で確かめる。
 *
 * afplay は起動しない。`setPlayer` に記録するだけの関数を渡し、実際に鳴る所をテストから外す。
 * イベントの判定は `handleToolExecutionEnd` / `handleSessionCompact` に直接渡し、
 * pi と ctx は必要な口だけの偽物で足りる。入口の配線は `registerSoundHandlers` に
 * 設定を直接渡し、実 FS の `settings.json` に依存させない。既定 export の結線だけは
 * 一時ディレクトリの実ファイルで確かめる。
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ToolExecutionEndEvent } from '@earendil-works/pi-coding-agent';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import entry, {
  handleSessionCompact,
  handleToolExecutionEnd,
  isCommitResult,
  registerSoundHandlers,
  setPlayer,
  type CtxPort,
  type EntryPiPort,
  type PiPort,
} from './index.ts';
import { tempDir } from '../../../test/temp-dir.ts';
import { defaultSettings, type Settings } from './settings/schema.ts';

const CMUX_COMMAND = 'cmux';
const CMUX_NOTIFY = 'notify';
const CMUX_FLAG_TITLE = '--title';
const CMUX_FLAG_SUBTITLE = '--subtitle';
const CMUX_FLAG_BODY = '--body';

const CUSTOM_SOUND = 'Basso';
const REWRITTEN_SOUND = 'Funk';
const PERMISSION_TITLE = 'Permission Required';
const QUESTION_TITLE = 'Which one?';

const pi: PiPort = { exec: async () => undefined };
const ctx: CtxPort = { hasUI: true };
const defaults: Settings = defaultSettings();

function withSounds(sounds: Partial<Settings['sounds']>): Settings {
  return { ...defaults, sounds: { ...defaults.sounds, ...sounds } };
}

function run(event: ToolExecutionEndEvent, config: Settings = defaults): void {
  handleToolExecutionEnd(pi, ctx, event, config);
}

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

function createEntry(config: Settings = defaults): {
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

/** 既定 export を一時ディレクトリの実ファイルで走らせる。dir も返す */
function entryWithFile(document: unknown): {
  dir: string;
  handlers: Map<string, (...args: unknown[]) => unknown>;
  calls: Array<{ command: string; args: string[] }>;
} {
  const dir = tempDir();
  writeFileSync(
    join(dir, 'settings.json'),
    typeof document === 'string' ? document : JSON.stringify(document),
  );
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
  entry(recordingPi, dir);
  return { dir, handlers, calls };
}

describe('sound-notify.settings', () => {
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

  it('defaultSettings() の 5 つの sounds をハンドラが鳴らす', async () => {
    const { handlers } = createEntry(defaults);
    await handlers.get('ui_prompt_start')?.({ title: PERMISSION_TITLE }, ctx);
    await handlers.get('ui_prompt_start')?.({ title: QUESTION_TITLE }, ctx);
    await handlers.get('agent_settled')?.({}, ctx);
    await handlers.get('tool_execution_end')?.(commitEvent(), ctx);
    await handlers.get('session_compact')?.({}, ctx);
    expect(played).toEqual([
      defaults.sounds.permission,
      defaults.sounds.question,
      defaults.sounds.done,
      defaults.sounds.commit,
      defaults.sounds.compact,
    ]);
  });

  it('enabled: false ではハンドラが鳴らさない', async () => {
    const disabled: Settings = { ...defaults, enabled: false };
    const { handlers } = createEntry(disabled);
    await handlers.get('ui_prompt_start')?.({ title: PERMISSION_TITLE }, ctx);
    await handlers.get('agent_settled')?.({}, ctx);
    handleToolExecutionEnd(pi, ctx, commitEvent(), disabled);
    handleSessionCompact(pi, ctx, disabled);
    expect(played).toEqual([]);
  });

  it('notifications: false では cmux を呼ばないが音は鳴る', async () => {
    const silent: Settings = { ...defaults, notifications: false };
    const { handlers, calls } = createEntry(silent);
    await handlers.get('agent_settled')?.({}, ctx);
    expect(played).toEqual([defaults.sounds.done]);
    expect(calls).toEqual([]);
  });
});

describe('sound-notify.default-export', () => {
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

  it('非既定の設定ファイル → その音で鳴る（起動時に読む）', async () => {
    const { handlers } = entryWithFile(withSounds({ commit: CUSTOM_SOUND }));
    await handlers.get('tool_execution_end')?.(commitEvent(), ctx);
    expect(played).toEqual([CUSTOM_SOUND]);
  });

  it('壊れた設定ファイル → 既定で動き、余計な通知をしない', async () => {
    const { handlers, calls } = entryWithFile('{"enabled":');
    await handlers.get('tool_execution_end')?.(commitEvent(), ctx);
    expect(played).toEqual([defaults.sounds.commit]);
    expect(calls).toEqual([]);
  });

  it('登録後の書き換え → 旧い音のまま（起動時の 1 回だけ読む）', async () => {
    const { dir, handlers } = entryWithFile(withSounds({ commit: CUSTOM_SOUND }));
    writeFileSync(
      join(dir, 'settings.json'),
      JSON.stringify(withSounds({ commit: REWRITTEN_SOUND })),
    );
    await handlers.get('tool_execution_end')?.(commitEvent(), ctx);
    expect(played).toEqual([CUSTOM_SOUND]);
  });
});

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

  it('bash の結果にコミットの形 → commit の音が 1 回鳴り、6 桁では鳴らない', () => {
    run(commitEvent());
    expect(played).toEqual([defaults.sounds.commit]);
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
    run(commitEvent(), withSounds({ commit: CUSTOM_SOUND }));
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

  it('圧縮が終わる → cmux の exec は呼ばれない', async () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    const recordingPi: PiPort = {
      exec: async (command, args) => {
        calls.push({ command, args });
        return undefined;
      },
    };
    handleSessionCompact(recordingPi, ctx, defaults);
    await Promise.resolve();
    expect(calls).toEqual([]);
    expect(played).toEqual([defaults.sounds.compact]);
  });

  it('sounds.compact を別名にする → その名前で鳴る', () => {
    handleSessionCompact(pi, ctx, withSounds({ compact: CUSTOM_SOUND }));
    expect(played).toEqual([CUSTOM_SOUND]);
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
    handleToolExecutionEnd(pi, noUI, commitEvent(), defaults);
    handleSessionCompact(pi, noUI, defaults);
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
    const { handlers } = createEntry(defaults);
    await handlers.get('ui_prompt_start')?.({ title: PERMISSION_TITLE }, ctx);
    expect(played).toEqual([defaults.sounds.permission]);
  });

  it('普通の質問 → question の音が鳴る', async () => {
    const { handlers } = createEntry(defaults);
    await handlers.get('ui_prompt_start')?.({ title: QUESTION_TITLE }, ctx);
    expect(played).toEqual([defaults.sounds.question]);
  });

  it('agent_settled → done の音と cmux の通知', async () => {
    const { handlers, calls } = createEntry(defaults);
    await handlers.get('agent_settled')?.({}, ctx);
    expect(played).toEqual([defaults.sounds.done]);
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

  it('permission の合図と普通の質問 → 通知の文面が違う', async () => {
    const { handlers, calls } = createEntry(defaults);
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
    const { handlers } = createEntry(defaults);
    const handler = handlers.get('session_compact');
    expect(handler).toBeDefined();
    await handler?.({}, ctx);
    expect(played).toEqual([defaults.sounds.compact]);
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
