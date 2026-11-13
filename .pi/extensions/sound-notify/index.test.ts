/**
 * commit と compact で鳴る音と拡張の入口の配線を、差し替えた鳴らす関数で確かめる。
 *
 * afplay は起動しない。`setPlayer` に記録するだけの関数を渡し、実際に鳴る処理をテストから外す。
 * イベントの判定は `handleToolExecutionEnd` と `handleSessionCompact` に直接渡し、
 * pi と ctx は必要な窓口だけの偽物で足りる。入口の配線は `registerSoundHandlers` に
 * 設定を直接渡し、実 FS の `settings.json` に依存させない。既定 export の結線だけは
 * 一時ディレクトリの実ファイルで確かめる。
 *
 * 偽の `pi` は `index.fixture.ts` の `recordingPi()` が組み立てる。
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
  type PiPort,
} from './index.ts';
import { recordingPi, type RecordingPi } from './index.fixture.ts';
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

function createEntry(config: Settings = defaults): RecordingPi {
  const recording = recordingPi();
  registerSoundHandlers(recording.pi, config);
  return recording;
}

/** 既定 export を一時ディレクトリの実ファイルで走らせる。dir も返す。 */
function entryWithFile(document: unknown): RecordingPi & { dir: string } {
  const dir = tempDir();
  writeFileSync(
    join(dir, 'settings.json'),
    typeof document === 'string' ? document : JSON.stringify(document),
  );
  const recording = recordingPi();
  entry(recording.pi, dir);
  return { ...recording, dir };
}

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

describe('sound-notify.settings', () => {
  it('enabled が false ではハンドラが鳴らない', async () => {
    const disabled: Settings = { ...defaults, enabled: false };
    const { handlers } = createEntry(disabled);
    await handlers.get('ui_prompt_start')?.({ title: PERMISSION_TITLE }, ctx);
    await handlers.get('agent_settled')?.({}, ctx);
    handleToolExecutionEnd(pi, ctx, commitEvent(), disabled);
    handleSessionCompact(pi, ctx, disabled);
    expect(played).toEqual([]);
  });

  it('notifications が false では cmux を呼ばないが音は鳴る', async () => {
    const silent: Settings = { ...defaults, notifications: false };
    const { handlers, calls } = createEntry(silent);
    await handlers.get('agent_settled')?.({}, ctx);
    expect(played).toEqual([defaults.sounds.done]);
    expect(calls).toEqual([]);
  });
});

describe('sound-notify.default-export', () => {
  it('登録後の書き換えでも古い音のままである（起動時の 1 回だけ読む）', async () => {
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
  it('bash の結果にコミットの形があれば commit の音が 1 回鳴る', () => {
    run(commitEvent());
    expect(played).toEqual([defaults.sounds.commit]);
  });

  it('bash の結果が普通の出力なら鳴らない', () => {
    run(
      commitEvent({
        result: { content: [{ type: 'text', text: 'ok\n3 passed' }] },
      }),
    );
    expect(played).toEqual([]);
  });

  it('toolName が bash 以外なら鳴らない', () => {
    run(commitEvent({ toolName: 'read' }));
    expect(played).toEqual([]);
  });

  it('isError が真なら鳴らない', () => {
    run(commitEvent({ isError: true }));
    expect(played).toEqual([]);
  });

  it('sounds.commit を別名にすればその名前で鳴る', () => {
    run(commitEvent(), withSounds({ commit: CUSTOM_SOUND }));
    expect(played).toEqual([CUSTOM_SOUND]);
  });
});

describe('sound-notify.compact', () => {
  it('圧縮が終われば cmux の exec は呼ばれない', async () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    const compactPi: PiPort = {
      exec: async (command, args) => {
        calls.push({ command, args });
        return undefined;
      },
    };
    handleSessionCompact(compactPi, ctx, defaults);
    await Promise.resolve();
    expect(calls).toEqual([]);
    expect(played).toEqual([defaults.sounds.compact]);
  });

  it('sounds.compact を別名にすればその名前で鳴る', () => {
    handleSessionCompact(pi, ctx, withSounds({ compact: CUSTOM_SOUND }));
    expect(played).toEqual([CUSTOM_SOUND]);
  });
});

describe('sound-notify.guard', () => {
  it('hasUI が false なら commit でも compact でも鳴らない', () => {
    const noUI: CtxPort = { hasUI: false };
    handleToolExecutionEnd(pi, noUI, commitEvent(), defaults);
    handleSessionCompact(pi, noUI, defaults);
    expect(played).toEqual([]);
  });
});

describe('sound-notify.prompt', () => {
  it('title が permission を含めば permission の音が鳴る', async () => {
    const { handlers } = createEntry(defaults);
    await handlers.get('ui_prompt_start')?.({ title: PERMISSION_TITLE }, ctx);
    expect(played).toEqual([defaults.sounds.permission]);
  });

  it('普通の質問なら question の音が鳴る', async () => {
    const { handlers } = createEntry(defaults);
    await handlers.get('ui_prompt_start')?.({ title: QUESTION_TITLE }, ctx);
    expect(played).toEqual([defaults.sounds.question]);
  });

  it('agent_settled なら done の音と cmux の通知がある', async () => {
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

  it('permission の合図と普通の質問は通知の文面が違う', async () => {
    const { handlers, calls } = createEntry(defaults);
    await handlers.get('ui_prompt_start')?.({ title: PERMISSION_TITLE }, ctx);
    await handlers.get('ui_prompt_start')?.({ title: QUESTION_TITLE }, ctx);
    const bodies = calls.map((call) => call.args[call.args.indexOf(CMUX_FLAG_BODY) + 1]);
    expect(bodies.length).toBe(2);
    expect(bodies[0]).not.toBe(bodies[1]);
  });
});

describe('sound-notify.entry', () => {
  it('session_compact を登録しそのハンドラを呼ぶと compact が 1 回鳴る', async () => {
    const { handlers } = createEntry(defaults);
    const handler = handlers.get('session_compact');
    expect(handler).toBeDefined();
    await handler?.({}, ctx);
    expect(played).toEqual([defaults.sounds.compact]);
  });
});

describe('isCommitResult', () => {
  it('文字列の result も見ることを確かめる', () => {
    const text = '[main abc1234] Add feature';
    expect(isCommitResult(commitEvent({ result: text }).result)).toBe(true);
  });
});
