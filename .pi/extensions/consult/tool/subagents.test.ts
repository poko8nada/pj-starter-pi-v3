import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { appendRun, type CheckRecord, type RunRecord } from '../run/log.ts';
import { placeFor, type Place } from '../run/place.ts';
import {
  USAGE,
  createSubagentsTool,
  elapsed,
  latest,
  listText,
  rowOf,
  rowsOf,
  type SubagentsArgs,
} from './subagents.ts';

// 置き場を偽物にするテストは、`tempDir()` と `placeFor` で作る（記録を読む側）。
// サブエージェントは起こさない（記録と、runtime の偽物だけで試す）。

function place(): Place {
  return placeFor(tempDir(), tempDir());
}

function record(extra: Partial<RunRecord> = {}): RunRecord {
  return {
    session: 'session-a',
    subagent: 'consult-1',
    role: 'review',
    pid: 999_999,
    started: 1000,
    ...extra,
  };
}

/** 記録を置き場に書き、その置き場を返す。`at` を渡せばその日の file に入る */
function withLog(records: readonly RunRecord[] = [record()], at?: Date): Place {
  const found = place();
  for (const run of records) {
    appendRun(found, run, at);
  }
  return found;
}

/** 一覧に出す口。置き場と、いまの session と、止める手を持つ偽の runtime */
function fakeHost(found: Place, session = 'session-a', check?: CheckRecord) {
  const cancelled: string[] = [];
  return {
    host: {
      place: found,
      sessionNow: () => session,
      ...(check === undefined ? {} : { check }),
      control: (
        action: { readonly action: 'list' } | { readonly action: 'cancel'; readonly id: string },
      ) => {
        if (action.action === 'cancel') {
          cancelled.push(action.id);
          return { text: `stopped: ${action.id}`, details: { id: action.id } };
        }
        return { text: 'list', details: {} };
      },
    },
    cancelled,
  };
}

function textOf(result: { readonly content: readonly unknown[] }): string {
  const first = result.content[0];
  return typeof first === 'object' && first !== null && 'text' in first ? String(first.text) : '';
}

const runningCheck = () => 'running' as const;
const endedCheck = () => 'ended' as const;

describe('elapsed', () => {
  it('秒で出し、60 秒を超えたら分と秒にする', () => {
    expect(elapsed(record({ started: 1000 }), 1000 + 12_000)).toBe('12s');
    expect(elapsed(record({ started: 0, ended: 125_000 }), 0)).toBe('2m05s');
  });

  it('終わったサブエージェントは終わりまでの時間（今ではない）', () => {
    expect(elapsed(record({ started: 0, ended: 5000 }), 10 ** 9)).toBe('5s');
  });
});

describe('rowOf / rowsOf', () => {
  it('id / role / 場所 / 状態 / 経過 / ターン / 費用 を 1 行に並べる', () => {
    const row = rowOf(
      record({ worktree: '2-a', turns: 12, spend: '0.01 usd' }),
      { alive: false, waiting: false },
      0,
    );
    expect(row).toContain('consult-1');
    expect(row).toContain('review');
    expect(row).toContain('worktree 2-a');
    expect(row).toContain('12 turns');
    expect(row).toContain('0.01 usd');
  });

  it('worktree が無いサブエージェントはベースと出す', () => {
    expect(rowOf(record(), { alive: false, waiting: false }, 0)).toContain('base');
  });

  it('終わったサブエージェントは state と reason を出す。走っているサブエージェントは出さない', () => {
    const done = rowOf(
      record({ ended: 2, state: 'turn-limit', reason: 'turn limit reached (40)' }),
      { alive: false, waiting: false },
      0,
    );
    expect(done).toContain('turn-limit');
    expect(done).toContain('reason: turn limit reached (40)');
    const running = rowOf(record(), { alive: true, waiting: false }, 0);
    expect(running).toContain('running');
    expect(running).not.toContain('reason:');
  });

  it('終わりの行が無く check が ended → lost（done と偽らない）', () => {
    const row = rowsOf([record({ token: 'a' })], endedCheck, 0)[0] ?? '';
    expect(row).toContain('lost');
    expect(row).not.toContain('done');
  });

  it('終了の行があるサブエージェントは running にしない（state を出す）', () => {
    const ended = record({ ended: 5, state: 'done' });
    expect(rowsOf([ended], runningCheck, 0)[0]).not.toContain('running');
    expect(rowsOf([ended], endedCheck, 0)[0]).toContain('done');
  });

  it('走っている開始行 → running (pid N)', () => {
    const rows = rowsOf([record({ subagent: 'consult-9', pid: 4242 })], runningCheck, 0);
    expect(rows[0]).toContain('running (pid 4242)');
  });

  it('印の無い完了の行 → running（pid を出さない）', () => {
    const done = record({ subagent: 'consult-9', ended: 2000, state: 'done', notice: 'できた' });
    const rows = rowsOf([done], runningCheck, 0);
    expect(rows[0]).toContain('running');
    expect(rows[0]).not.toContain('pid');
  });

  it('印のある完了の行 → done', () => {
    const done = record({ subagent: 'consult-9', ended: 2000, state: 'done', notice: 'できた' });
    const mark = record({ subagent: 'consult-9', delivered: 3000 });
    const rows = rowsOf([done, mark], runningCheck, 0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain('done');
    expect(rows[0]).not.toContain('running');
  });

  it('記録が空 → []', () => {
    expect(rowsOf([], runningCheck, 0)).toEqual([]);
  });
});

describe('latest', () => {
  it('サブエージェントごとに 1 本に畳む（終わりの行があれば順序に依らずそれを採る）', () => {
    const running = record({ subagent: 'consult-1', pid: 5 });
    const done = record({ subagent: 'consult-1', pid: 5, ended: 2000, state: 'done' });
    const other = record({ subagent: 'consult-2', started: 3000 });
    expect(latest([running, other, done]).map((row) => [row.subagent, row.state])).toEqual([
      ['consult-1', 'done'],
      ['consult-2', undefined],
    ]);
  });

  it('終了行が開始行より先に来る（逆順）→ 一覧は done（ended の行を採る）', () => {
    const running = record({ subagent: 'consult-1', pid: 5 });
    const done = record({ subagent: 'consult-1', pid: 5, ended: 2000, state: 'done' });
    expect(latest([done, running]).map((row) => [row.subagent, row.state])).toEqual([
      ['consult-1', 'done'],
    ]);
  });

  it('記録が空 → 空のまま', () => {
    expect(latest([])).toEqual([]);
  });
});

describe('listText', () => {
  it('記録が無ければそう言う（空行を返さない）', () => {
    expect(listText([], 0)).toBe('no subagents in this project yet');
  });
});

describe('createSubagentsTool', () => {
  it('{action: list} → 記録の行が出る', async () => {
    const found = withLog([
      record({ worktree: '2-a', ended: 2000, state: 'done', turns: 3, spend: '0.002 usd' }),
    ]);
    const { host } = fakeHost(found);
    const args: SubagentsArgs = [
      'call',
      { action: 'list' },
      undefined,
      undefined,
      { cwd: tempDir() },
    ];
    const out = await createSubagentsTool(host)(...args);
    const text = textOf(out);
    expect(text).toContain('consult-1');
    expect(text).toContain('worktree 2-a');
    expect(text).toContain('done');
  });

  it('action を省くと list（既定）', async () => {
    const found = withLog([record({ ended: 2000, state: 'done' })]);
    const { host } = fakeHost(found);
    const args: SubagentsArgs = ['call', {}, undefined, undefined, { cwd: tempDir() }];
    const out = await createSubagentsTool(host)(...args);
    expect(textOf(out)).toContain('consult-1');
  });

  it('list の check の口が効く（running と ended を返す差し替えで一覧の状態が変わる）', async () => {
    const start = record({
      session: 'session-a',
      subagent: 'consult-1',
      pid: 11,
      startToken: 'Wed Oct 21 12:41:12 2026',
    });
    const runningFound = withLog([start]);
    const runningArgs: SubagentsArgs = [
      'call',
      { action: 'list' },
      undefined,
      undefined,
      { cwd: tempDir() },
    ];
    expect(
      textOf(
        await createSubagentsTool(fakeHost(runningFound, 'session-a', runningCheck).host)(
          ...runningArgs,
        ),
      ),
    ).toContain('running');
    const endedFound = withLog([start]);
    const endedArgs: SubagentsArgs = [
      'call',
      { action: 'list' },
      undefined,
      undefined,
      { cwd: tempDir() },
    ];
    const endedText = textOf(
      await createSubagentsTool(fakeHost(endedFound, 'session-a', endedCheck).host)(...endedArgs),
    );
    expect(endedText).toContain('lost');
    expect(endedText).not.toContain('running');
  });

  it('2 つの session のサブエージェントが居る → いまの session のサブエージェントだけが出る', async () => {
    const found = withLog([
      record({ session: 'session-a', subagent: 'consult-1', ended: 2000, state: 'done' }),
      record({ session: 'session-b', subagent: 'consult-2', ended: 2000, state: 'done' }),
    ]);
    const { host } = fakeHost(found, 'session-a');
    const args: SubagentsArgs = [
      'call',
      { action: 'list' },
      undefined,
      undefined,
      { cwd: tempDir() },
    ];
    const text = textOf(await createSubagentsTool(host)(...args));
    expect(text).toContain('consult-1');
    expect(text).not.toContain('consult-2');
  });

  it('3 日前に始まっていまも走っているサブエージェント（終わりの行が無い）→ 一覧に出ない', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    // 2 日より長く走るサブエージェントは窓の外に出る（受け入れる限界）
    const found = withLog([record({ subagent: 'consult-old', pid: process.pid })], threeDaysAgo);
    const { host } = fakeHost(found);
    const args: SubagentsArgs = [
      'call',
      { action: 'list' },
      undefined,
      undefined,
      { cwd: tempDir() },
    ];
    const text = textOf(await createSubagentsTool(host)(...args));
    expect(text).not.toContain('consult-old');
  });

  it('3 日前に始まって今日終わったサブエージェント → state 付きで出る（終わりの行は今日の file）', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const found = place();
    appendRun(found, record({ subagent: 'consult-long', pid: process.pid }), threeDaysAgo);
    appendRun(
      found,
      record({ subagent: 'consult-long', pid: process.pid, ended: 2000, state: 'done' }),
    );
    const { host } = fakeHost(found);
    const args: SubagentsArgs = [
      'call',
      { action: 'list' },
      undefined,
      undefined,
      { cwd: tempDir() },
    ];
    const text = textOf(await createSubagentsTool(host)(...args));
    expect(text).toContain('consult-long');
    expect(text).toContain('done');
  });

  it('{action: cancel, id} → 止めた結果が返る', async () => {
    const found = withLog();
    const { host, cancelled } = fakeHost(found);
    const args: SubagentsArgs = [
      'call',
      { action: 'cancel', id: 'consult-1' },
      undefined,
      undefined,
      { cwd: tempDir() },
    ];
    const out = await createSubagentsTool(host)(...args);
    expect(textOf(out)).toContain('stopped: consult-1');
    expect(cancelled).toEqual(['consult-1']);
  });

  it('{action: cancel}（id 無し）→ 使い方つきで投げる', async () => {
    const found = withLog();
    const { host } = fakeHost(found);
    const args: SubagentsArgs = [
      'call',
      { action: 'cancel' },
      undefined,
      undefined,
      { cwd: tempDir() },
    ];
    await expect(createSubagentsTool(host)(...args)).rejects.toThrow(
      /consult_subagents: cancel needs id/,
    );
    expect(USAGE).toContain('cancel needs id');
  });

  it('知らない action → 投げる', async () => {
    const found = withLog();
    const { host } = fakeHost(found);
    const args: SubagentsArgs = [
      'call',
      { action: 'stop' },
      undefined,
      undefined,
      { cwd: tempDir() },
    ];
    await expect(createSubagentsTool(host)(...args)).rejects.toThrow(
      /consult_subagents: action is list or cancel/,
    );
  });

  it('USAGE は consult_subagents: で始まる', () => {
    expect(USAGE.startsWith('consult_subagents:')).toBe(true);
  });
});
