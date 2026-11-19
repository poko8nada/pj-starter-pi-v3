import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tempDir } from '../../../test/temp-dir.ts';
import { aDoneRun, aPiFace, aPlace, aRunRecord, aWidgetUI } from './consult.fixture.ts';
import { appendRun, deliveredKeys, KEEP_DAYS, readRuns, type RunRecord } from './run/log.ts';
import { pendingReports } from './run/delivery.ts';
import { type Place } from './run/place.ts';
import entry, {
  buildDeps,
  buildLaunch,
  flushPending,
  roleOrder,
  showRunningOnce,
  startTick,
  stopTick,
  type TickPort,
} from './index.ts';
import { loadTypes } from './policy/types.ts';
import { CONSULT_ROOT } from './run/worktree.ts';
import type { GitOutput } from './run/run.ts';
import { spawn, spawnSync } from 'node:child_process';
import { WIDGET_KEY, type WidgetUI } from './view/widget.ts';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import type {
  ConsultMessage,
  CommandContext,
  ConsultRuntime,
  PiFace,
  RuntimeInput,
} from './tool/consult.ts';
import { SOUND_INTERVAL_MS, setPlayer, setSoundEnabled } from './tool/sound.ts';

const seenLaunches = vi.hoisted(() => [] as Array<RuntimeInput['launch']>);

vi.mock('./tool/consult.ts', async (importOriginal) => {
  const actual = await importOriginal<{
    createRuntime: (input: RuntimeInput) => ConsultRuntime;
  }>();
  return {
    ...actual,
    createRuntime: (input: RuntimeInput) => {
      seenLaunches.push(input.launch);
      return actual.createRuntime(input);
    },
  };
});

function record(extra: Partial<RunRecord> = {}): RunRecord {
  return aDoneRun({ notice: 'できた', ...extra });
}

/** 記録は「いま」の日付ファイルに書く。読み取り側も同じテストの時計を見るので、日付は固定しない */
function pending(found: Place): void {
  appendRun(found, record());
}

/** 走っている記録を 1 行足す。pid はこのテストのプロセスなので、既定の check で走っていると見える */
function running(found: Place, role = 'review'): void {
  appendRun(found, aRunRecord({ role, pid: process.pid }), new Date());
}

function fakePi(fail: { next: boolean } = { next: false }): {
  pi: PiFace;
  sent: readonly ConsultMessage[];
} {
  const made = aPiFace();
  if (fail.next) {
    made.failNext();
  }
  return { pi: made.pi, sent: made.sent };
}

/** 呼び出しを捨てる ui。ウィジェットを見ないテストで使う */
function quietUI(): WidgetUI {
  return { setWidget: () => {} };
}

/** 時刻の固定値。時計を渡す検査で、同じ関数であることを確かめるために使う */
const fixedNow = (): number => 0;

function portFor(
  found: Place,
  pi: PiFace,
  session = 'session-a',
  check?: TickPort['check'],
): TickPort {
  return {
    pi,
    place: found,
    sessionNow: () => session,
    ui: quietUI(),
    ...(check === undefined ? {} : { check }),
  };
}

const played: string[] = [];

beforeEach(() => {
  played.length = 0;
  vi.useFakeTimers();
  setSoundEnabled(true);
  stopTick();
  setPlayer(() => {
    played.push('tink');
  });
  vi.stubEnv('CONSULT_ROOT', tempDir());
});

afterEach(() => {
  stopTick();
  setSoundEnabled(true);
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('flushPending', () => {
  it('0 件 → 0 を返す。送らない', () => {
    const found = aPlace();
    const { pi, sent } = fakePi();

    expect(flushPending(portFor(found, pi, 'session-a'))).toBe(0);
    expect(sent).toHaveLength(0);
  });
});

describe('startTick / stopTick', () => {
  it('印のない完了の行、startTick、5 秒進める → 送り 1 回、印 1 本、音 1 回', () => {
    const found = aPlace();
    pending(found);
    const { pi, sent } = fakePi();
    startTick(portFor(found, pi, 'session-a'));

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);

    expect(sent).toHaveLength(1);
    expect(played).toHaveLength(1);
    const runs = readRuns(found, { session: 'session-a', days: KEEP_DAYS });
    expect(runs).toHaveLength(2);
    expect(deliveredKeys(runs).size).toBe(1);
    expect(pendingReports(found, { session: 'session-a', days: KEEP_DAYS })).toEqual([]);
  });

  it('走っている開始行 → 5 秒進める → 音が 1 回。送らない', () => {
    const found = aPlace();
    running(found);
    const { pi, sent } = fakePi();
    startTick(portFor(found, pi, 'session-a'));

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);

    expect(sent).toHaveLength(0);
    expect(played).toHaveLength(1);
  });

  it('何もない → 5 秒進めても、送らず鳴らさない', () => {
    const found = aPlace();
    const { pi, sent } = fakePi();
    startTick(portFor(found, pi, 'session-a'));

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);

    expect(sent).toHaveLength(0);
    expect(played).toHaveLength(0);
  });

  it('音が off、印のない完了 → 鳴らさず、送る', () => {
    const found = aPlace();
    pending(found);
    setSoundEnabled(false);
    const { pi, sent } = fakePi();
    startTick(portFor(found, pi, 'session-a'));

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);

    expect(sent).toHaveLength(1);
    expect(played).toHaveLength(0);
  });

  it('sendMessage が投げる → 印を書かない。次の tick で送り直す', () => {
    const found = aPlace();
    pending(found);
    const fail = { next: true };
    const { pi, sent } = fakePi(fail);
    startTick(portFor(found, pi, 'session-a'));

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);
    expect(sent).toHaveLength(0);

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);
    expect(sent).toHaveLength(1);
  });

  it('startTick を 2 回呼ぶ → タイマーは 1 本。5 秒で送信 1 回、音 1 回', () => {
    const found = aPlace();
    pending(found);
    const { pi, sent } = fakePi();
    const port = portFor(found, pi, 'session-a');
    startTick(port);
    startTick(port);

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);

    expect(sent).toHaveLength(1);
    expect(played).toHaveLength(1);
  });

  it('stopTick の後、10 秒進める → 送らず鳴らさない', () => {
    const found = aPlace();
    pending(found);
    const { pi, sent } = fakePi();
    startTick(portFor(found, pi, 'session-a'));
    stopTick();

    vi.advanceTimersByTime(SOUND_INTERVAL_MS * 2);

    expect(sent).toHaveLength(0);
    expect(played).toHaveLength(0);
  });
});

describe('widget', () => {
  it('startTick: (happy) 走っている review が 1 体 → consult-running を更新する', () => {
    const found = aPlace();
    running(found);
    const { pi } = fakePi();
    const { ui, calls } = aWidgetUI();
    startTick({ ...portFor(found, pi, 'session-a'), ui });

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);

    expect(calls.some((call) => call.key === WIDGET_KEY)).toBe(true);
  });

  it('setWidget が投げる → 音は鳴り、完了報告の送信は続く', () => {
    const found = aPlace();
    pending(found);
    const { pi, sent } = fakePi();
    const ui: WidgetUI = {
      setWidget: () => {
        throw new Error('ui');
      },
    };
    startTick({ ...portFor(found, pi, 'session-a'), ui });

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);

    expect(sent).toHaveLength(1);
    expect(played).toHaveLength(1);
  });
});

describe('showRunningOnce', () => {
  it('showRunningOnce: (happy) 走っている記録 → consult-running を更新する', () => {
    const found = aPlace();
    running(found);
    const { ui, calls } = aWidgetUI();
    showRunningOnce(ui, found, 'session-a');

    expect(calls.some((call) => call.key === WIDGET_KEY)).toBe(true);
  });
});

describe('roleOrder', () => {
  it('roleOrder: (happy) 既定のルートで呼ぶ → types.json の並びを返す', () => {
    const root = dirname(fileURLToPath(import.meta.url));
    expect(roleOrder()).toEqual(loadTypes(root).map((type) => type.name));
  });

  it('roleOrder: (empty) types.json のない一時ディレクトリで呼ぶ → [] を返す', () => {
    expect(roleOrder(tempDir())).toEqual([]);
  });
});

describe('reload', () => {
  it('同じ印で tick を進める → 送り 1 回、音 1 回、2 回目は送らない', () => {
    const found = aPlace();
    const subagent = 'consult-9';
    appendRun(found, record({ subagent }), new Date());

    const { pi, sent } = fakePi();
    startTick(portFor(found, pi, 'session-a'));

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);
    expect(sent).toHaveLength(1);
    expect(played).toHaveLength(1);

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);
    expect(sent).toHaveLength(1);
  });
});

describe('buildDeps', () => {
  it('buildDeps: (happy) env に CONSULT_ROOT がある → root にその値が入る', () => {
    const deps = buildDeps({ CONSULT_ROOT: '/tmp/consult-test' }, () => ({
      status: 0,
      stdout: '',
      stderr: '',
    }));
    expect(deps.root).toBe('/tmp/consult-test');
  });

  it('buildDeps: (empty) env に CONSULT_ROOT がない → root に既定値が入る', () => {
    const deps = buildDeps({}, () => ({ status: 0, stdout: '', stderr: '' }));
    expect(deps.root).toBe(CONSULT_ROOT);
  });

  it('buildDeps: (happy) ラッパーに cwd と args を渡す → 元の git に env とともに渡る', () => {
    const seen: Array<{
      cwd: string;
      args: readonly string[];
      env: Readonly<NodeJS.ProcessEnv>;
    }> = [];
    const env = { CONSULT_ROOT: '/tmp/consult-test' };
    const git = (
      cwd: string,
      args: readonly string[],
      received: Readonly<NodeJS.ProcessEnv>,
    ): GitOutput => {
      seen.push({ cwd, args, env: received });
      return { status: 0, stdout: '', stderr: '' };
    };
    const deps = buildDeps(env, git);
    deps.git('/tmp/repo', ['status', '--porcelain']);
    expect(seen).toEqual([{ cwd: '/tmp/repo', args: ['status', '--porcelain'], env }]);
  });
});

describe('buildLaunch', () => {
  it('buildLaunch: (happy) env に GIT_INDEX_FILE がある → launch.env から落ちる', () => {
    const launch = buildLaunch(
      { KEEP: 'y', GIT_INDEX_FILE: '/tmp/index' },
      spawn,
      spawnSync,
      Date.now,
    );
    expect(launch.env.KEEP).toBe('y');
    expect('GIT_INDEX_FILE' in launch.env).toBe(false);
  });

  it('buildLaunch: (happy) spawn を渡す → launch.spawn が同じ', () => {
    const launch = buildLaunch({}, spawn, spawnSync, Date.now);
    expect(launch.spawn).toBe(spawn);
  });

  it('buildLaunch: (happy) spawnSync を渡す → launch.spawnSync が同じ', () => {
    const launch = buildLaunch({}, spawn, spawnSync, Date.now);
    expect(launch.spawnSync).toBe(spawnSync);
  });

  it('buildLaunch: (happy) now を渡す → launch.now が同じ', () => {
    const launch = buildLaunch({}, spawn, spawnSync, fixedNow);
    expect(launch.now).toBe(fixedNow);
  });
});

describe('entry wiring', () => {
  type FakeCommand = {
    readonly description: string;
    readonly handler: (args: string, ctx: CommandContext) => unknown;
  };

  /** 入口の配線だけを見る偽の ExtensionAPI。登録されたコマンドとレンダラーを記録する */
  function fakeEntry(): {
    commands: Map<string, FakeCommand>;
    received: Array<[string, unknown]>;
    handlers: Map<string, (event: unknown, ctx: unknown) => unknown>;
  } {
    const commands = new Map<string, FakeCommand>();
    const received: Array<[string, unknown]> = [];
    const handlers = new Map<string, (event: unknown, ctx: unknown) => unknown>();
    const fake = {
      on: (name: string, handler: (event: unknown, ctx: unknown) => unknown) => {
        handlers.set(name, handler);
        return () => {};
      },
      registerTool: () => {},
      registerCommand: (name: string, options: FakeCommand) => {
        commands.set(name, options);
      },
      registerMessageRenderer: (customType: string, renderer: unknown) => {
        received.push([customType, renderer]);
      },
    };
    // ExtensionAPI は 30 以上のメンバーを持つため、すべてを偽物で用意する価値がない。入口の配線だけを見るので、使う 4 つの入口だけを持つ偽物を渡す。
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    entry(fake as unknown as ExtensionAPI);
    return { commands, received, handlers };
  }

  it('入口を呼ぶ → consult のレンダラーが 1 件登録される', () => {
    const { received } = fakeEntry();
    expect(received).toHaveLength(1);
  });

  it('consult-status を登録する → 説明文を持つ', () => {
    const { commands } = fakeEntry();
    const command = commands.get('consult-status');
    expect(command?.description).toBe('List the running consult subagents of this session');
  });

  it('entry wiring: (happy) 起動時の env が launch.env に写る → 後の変更は伝わらず GIT_* が落ちる', () => {
    seenLaunches.length = 0;
    process.env.PI_WIRING_PROBE = 'before';
    process.env.GIT_WIRING_PROBE = 'drop-me';
    try {
      fakeEntry();
      process.env.PI_WIRING_PROBE = 'after';
      const launch = seenLaunches.at(-1);
      if (launch === undefined) {
        throw new Error('createRuntime was not called');
      }
      expect(launch.env.PI_WIRING_PROBE).toBe('before');
      expect('GIT_WIRING_PROBE' in launch.env).toBe(false);
    } finally {
      delete process.env.PI_WIRING_PROBE;
      delete process.env.GIT_WIRING_PROBE;
    }
  });

  it('entry wiring: (happy) 本物の spawn と spawnSync がそのまま launch に載る', () => {
    seenLaunches.length = 0;
    fakeEntry();
    const launch = seenLaunches.at(-1);
    if (launch === undefined) {
      throw new Error('createRuntime was not called');
    }
    expect(launch.spawn).toBe(spawn);
    expect(launch.spawnSync).toBe(spawnSync);
  });
});
