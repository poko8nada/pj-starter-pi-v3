import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { dayFile, placeFor, type Place } from './place.ts';
import {
  appendRun,
  closeOrphans,
  isRunning,
  parseRun,
  pidAlive,
  readRuns,
  runningRuns,
  type RunRecord,
} from './log.ts';

// 置き場を偽物にするテストは、`tmpDir()` と `placeFor` で作る（記録を読む側）。
// 実物の /tmp/pi-consult を触らない。

function place(): Place {
  return placeFor(tmpDir(), tmpDir());
}

function record(extra: Partial<RunRecord> = {}): RunRecord {
  return {
    session: 'session-a',
    subagent: 'consult-1',
    role: 'review',
    pid: process.pid,
    started: 1000,
    ...extra,
  };
}

describe('appendRun / readRuns', () => {
  it('1 行足して読む → その 1 行がそのまま返る', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    const run = record({ worktree: '2-a', turns: 12, spend: '0.01 usd' });
    appendRun(found, run, at);
    expect(readRuns(found, { at })).toEqual([run]);
    expect(readFileSync(dayFile(found, at), 'utf8').trim().split('\n')).toHaveLength(1);
  });

  it('同じ run を 2 回足す → 2 行になる（追記で、上書きしない）', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    appendRun(found, record({ started: 1 }), at);
    appendRun(found, record({ started: 1 }), at);
    expect(readRuns(found, { at })).toHaveLength(2);
  });

  it('置き場が無い → 空の配列', () => {
    expect(readRuns(place())).toEqual([]);
  });

  it('壊れた行（JSON でない）→ その行だけ飛ばし、他は読める', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    appendRun(found, record({ started: 1 }), at);
    const file = dayFile(found, at);
    writeFileSync(file, `${readFileSync(file, 'utf8')}これは JSON ではない\n`);
    appendRun(found, record({ started: 2 }), at);
    expect(readRuns(found, { at }).map((run) => run.started)).toEqual([1, 2]);
  });

  it('形が違う行（必須欄が無い）も飛ばす', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    appendRun(found, record({ started: 1 }), at);
    const file = dayFile(found, at);
    // subagent が無い行と session が無い行の 2 種類。どちらも parseRun が落とす
    writeFileSync(
      file,
      `${readFileSync(file, 'utf8')}{"session":"session-a","role":"review","pid":1,"started":2}\n{"subagent":"consult-9","role":"review","pid":1,"started":3}\n`,
    );
    expect(readRuns(found, { at }).map((run) => run.started)).toEqual([1]);
  });

  it('始まった順に返す', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    appendRun(found, record({ started: 2000, subagent: 'consult-2' }), at);
    appendRun(found, record({ started: 1000, subagent: 'consult-1' }), at);
    expect(readRuns(found, { at }).map((run) => run.subagent)).toEqual(['consult-1', 'consult-2']);
  });

  it('終わりの欄を持つ行はそのまま返る（state と reason）', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    appendRun(
      found,
      record({
        ended: 2000,
        state: 'turn-limit',
        reason: 'turn limit reached (40)',
        files: ['a.ts'],
      }),
      at,
    );
    expect(readRuns(found, { at })[0]).toMatchObject({
      state: 'turn-limit',
      reason: 'turn limit reached (40)',
      files: ['a.ts'],
    });
  });

  it('日をまたぐサブエージェントの開始と終わりは別の file に 1 行ずつ', () => {
    const found = place();
    const start = record({ subagent: 'consult-1', started: 1 });
    const end = { ...start, ended: 2, state: 'done' as const };
    appendRun(found, start, new Date(2026, 9, 9, 23, 59));
    appendRun(found, end, new Date(2026, 9, 10, 0, 1));
    expect(
      readFileSync(join(found.dir, '2026-10-09.jsonl'), 'utf8').trim().split('\n'),
    ).toHaveLength(1);
    expect(
      readFileSync(join(found.dir, '2026-10-10.jsonl'), 'utf8').trim().split('\n'),
    ).toHaveLength(1);
  });

  it('at を渡さない appendRun は今日の file に書く', () => {
    const found = place();
    appendRun(found, record());
    expect(readRuns(found).map((run) => run.subagent)).toEqual(['consult-1']);
  });

  it('session で絞る → その session だけ。省けば両方', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    appendRun(found, record({ session: 'A', subagent: 'consult-1' }), at);
    appendRun(found, record({ session: 'B', subagent: 'consult-2' }), at);
    expect(readRuns(found, { at, session: 'A' }).map((run) => run.subagent)).toEqual(['consult-1']);
    expect(readRuns(found, { at }).map((run) => run.subagent)).toEqual(['consult-1', 'consult-2']);
  });
});

describe('pidAlive', () => {
  it('自分の pid は生きている', () => {
    expect(pidAlive(process.pid)).toBe(true);
  });

  it('ありえない pid と 0 以下 → 死んでいる扱い', () => {
    // macOS の pid は 5 桁まで。6 桁は存在しない
    expect(pidAlive(999999)).toBe(false);
    expect(pidAlive(0)).toBe(false);
    expect(pidAlive(-1)).toBe(false);
  });
});

describe('isRunning', () => {
  it('終わりの行が無く pid が生きている → true', () => {
    expect(isRunning(record({ pid: 42 }), () => 'running')).toBe(true);
  });

  it('pid が死んでいれば、終わりの行が無くても false（メインエージェントごと落ちたサブエージェント）', () => {
    expect(isRunning(record({ pid: 42 }), () => 'ended')).toBe(false);
  });

  it('startToken 付きの行で check が running → true', () => {
    expect(
      isRunning(record({ pid: 42, startToken: 'Wed Oct 21 12:41:12 2026' }), () => 'running'),
    ).toBe(true);
  });

  it('startToken 付きの行で check が ended → false', () => {
    expect(
      isRunning(record({ pid: 42, startToken: 'Wed Oct 21 12:41:12 2026' }), () => 'ended'),
    ).toBe(false);
  });

  it('startToken 付きの行で check が unknown → true（読めないときは走っている側）', () => {
    expect(
      isRunning(record({ pid: 42, startToken: 'Wed Oct 21 12:41:12 2026' }), () => 'unknown'),
    ).toBe(true);
  });

  it('startToken 無しの行で pidAlive が true → 走っている（移行）', () => {
    expect(isRunning(record({ pid: process.pid }))).toBe(true);
  });

  it('startToken 無しの行で pidAlive が false → 走っていない', () => {
    expect(isRunning(record({ pid: 999_999 }))).toBe(false);
  });

  it('ended のある行に check を渡す → false（短絡）', () => {
    expect(
      isRunning(
        record({ pid: 42, startToken: 'Wed Oct 21 12:41:12 2026', ended: 2000, state: 'done' }),
        () => 'running',
      ),
    ).toBe(false);
  });
});

describe('runningRuns', () => {
  it('session で絞り、走っている行だけ返す', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    appendRun(found, record({ session: 'A', subagent: 'consult-live', pid: process.pid }), at);
    appendRun(
      found,
      record({
        session: 'A',
        subagent: 'consult-done',
        pid: process.pid,
        ended: 2000,
        state: 'done',
      }),
      at,
    );
    appendRun(found, record({ session: 'B', subagent: 'consult-other', pid: process.pid }), at);

    expect(runningRuns(found, { at, session: 'A' }).map((run) => run.subagent)).toEqual([
      'consult-live',
    ]);
  });

  it('check を通す → running だけ残る', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    appendRun(found, record({ session: 'A', subagent: 'consult-1', pid: 11, token: 'a' }), at);
    appendRun(found, record({ session: 'A', subagent: 'consult-2', pid: 22, token: 'b' }), at);
    const seen: string[] = [];
    const out = runningRuns(found, { at, session: 'A' }, (entry) => {
      seen.push(entry.subagent);
      return entry.token === 'a' ? 'running' : 'ended';
    });
    expect(out.map((run) => run.subagent)).toEqual(['consult-1']);
    expect(seen).toEqual(['consult-1', 'consult-2']);
  });

  it('token 無しの行は pidAlive で決まる（移行）', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    appendRun(found, record({ session: 'A', subagent: 'consult-live', pid: process.pid }), at);
    appendRun(found, record({ session: 'A', subagent: 'consult-dead', pid: 999_999 }), at);
    expect(runningRuns(found, { at, session: 'A' }).map((run) => run.subagent)).toEqual([
      'consult-live',
    ]);
  });

  it('同じ subagent に開始行と終了行があり、pid が生きている → 走っていない（事故の形）', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    appendRun(found, record({ session: 'A', subagent: 'consult-1', pid: process.pid }), at);
    appendRun(
      found,
      record({
        session: 'A',
        subagent: 'consult-1',
        pid: process.pid,
        ended: 2000,
        state: 'done',
      }),
      at,
    );
    expect(runningRuns(found, { at, session: 'A' })).toEqual([]);
  });

  it('開始行だけで token が合う → 走っている', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    appendRun(found, record({ session: 'A', subagent: 'consult-1', pid: 11, token: 'a' }), at);
    const out = runningRuns(found, { at, session: 'A' }, () => 'running');
    expect(out.map((run) => run.subagent)).toEqual(['consult-1']);
  });

  it('開始行だけで token が合わない → 走っていない', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    appendRun(found, record({ session: 'A', subagent: 'consult-1', pid: 11, token: 'a' }), at);
    expect(runningRuns(found, { at, session: 'A' }, () => 'ended')).toEqual([]);
  });

  it('行が無い → 空', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    expect(runningRuns(found, { at, session: 'A' }, () => 'running')).toEqual([]);
  });

  it('終了行が新しい日のファイル、開始行が古い日のファイル → 走っていない', () => {
    const found = place();
    appendRun(
      found,
      record({ session: 'A', subagent: 'consult-1', pid: process.pid, started: 1 }),
      new Date(2026, 9, 9, 23, 59),
    );
    appendRun(
      found,
      record({
        session: 'A',
        subagent: 'consult-1',
        pid: process.pid,
        started: 1,
        ended: 2,
        state: 'done',
      }),
      new Date(2026, 9, 10, 0, 1),
    );
    const at = new Date(2026, 9, 10, 12, 0);
    expect(runningRuns(found, { at, session: 'A', days: 2 }, () => 'running')).toEqual([]);
  });

  it('check が unknown → 走っている側（空でない）', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    appendRun(
      found,
      record({
        session: 'A',
        subagent: 'consult-1',
        pid: 11,
        startToken: 'Wed Oct 21 12:41:12 2026',
      }),
      at,
    );
    expect(
      runningRuns(found, { at, session: 'A' }, () => 'unknown').map((run) => run.subagent),
    ).toEqual(['consult-1']);
  });
});

describe('parseRun', () => {
  it('本体の欄を上書きしない（worktree を持ち上げた後で、元の値で壊さない）', () => {
    const run = parseRun(
      '{"session":"s","subagent":"c","role":"r","pid":1,"started":2,"worktree":"w"}',
    );
    expect(run).toMatchObject({
      session: 's',
      subagent: 'c',
      role: 'r',
      pid: 1,
      started: 2,
      worktree: 'w',
    });
  });

  it('session が無い行は飛ばす', () => {
    expect(parseRun('{"subagent":"c","role":"r","pid":1,"started":2}')).toBeUndefined();
  });

  it('旧形の行（child 欄だけを持つ JSON）は捨てる', () => {
    expect(parseRun('{"session":"s","child":"c","role":"r","pid":1,"started":2}')).toBeUndefined();
  });

  it('token 付きの開始行 → token が返る（往復）', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    appendRun(found, record({ token: 'token-1' }), at);
    expect(readRuns(found, { at })[0]).toMatchObject({ token: 'token-1' });
    expect(
      parseRun('{"session":"s","subagent":"c","role":"r","pid":1,"started":2,"token":"token-1"}'),
    ).toMatchObject({ token: 'token-1' });
  });

  it('token 無しの行（古い形）→ token は undefined で読める', () => {
    expect(parseRun('{"session":"s","subagent":"c","role":"r","pid":1,"started":2}')).toMatchObject(
      { session: 's' },
    );
    expect(
      parseRun('{"session":"s","subagent":"c","role":"r","pid":1,"started":2}')?.token,
    ).toBeUndefined();
  });

  it('token が数値の行 → token を捨て、行は読める', () => {
    const run = parseRun(
      '{"session":"s","subagent":"c","role":"r","pid":1,"started":2,"token":123}',
    );
    expect(run).toBeDefined();
    expect(run?.token).toBeUndefined();
  });

  it('startToken 付きの開始行 → 往復して同じ文字列が返る', () => {
    const at = new Date(2026, 9, 10, 12, 0);
    const found = place();
    appendRun(found, record({ startToken: 'Wed Oct 21 12:41:12 2026' }), at);
    expect(readRuns(found, { at })[0]).toMatchObject({
      startToken: 'Wed Oct 21 12:41:12 2026',
    });
    expect(
      parseRun(
        '{"session":"s","subagent":"c","role":"r","pid":1,"started":2,"startToken":"Wed Oct 21 12:41:12 2026"}',
      ),
    ).toMatchObject({ startToken: 'Wed Oct 21 12:41:12 2026' });
  });

  it('startToken 無しの行 → undefined で読める', () => {
    expect(parseRun('{"session":"s","subagent":"c","role":"r","pid":1,"started":2}')).toMatchObject(
      { session: 's' },
    );
    expect(
      parseRun('{"session":"s","subagent":"c","role":"r","pid":1,"started":2}')?.startToken,
    ).toBeUndefined();
  });

  it('startToken が数値の行 → 捨てて、行は読める', () => {
    const run = parseRun(
      '{"session":"s","subagent":"c","role":"r","pid":1,"started":2,"startToken":123}',
    );
    expect(run).toBeDefined();
    expect(run?.startToken).toBeUndefined();
  });
});

describe('closeOrphans', () => {
  it('終了行の無い開始行で token が合わない → state: error の終了行が 1 行増え、runningRuns が空になる', () => {
    const found = place();
    appendRun(found, record({ session: 'A', subagent: 'consult-1', pid: 11, token: 'a' }));
    const before = readRuns(found, { session: 'A' });
    expect(before).toHaveLength(1);
    const closed = closeOrphans(found, 'A', () => 'ended');
    expect(closed).toHaveLength(1);
    expect(closed[0]).toMatchObject({ state: 'error' });
    expect(readRuns(found, { session: 'A' })).toHaveLength(2);
    expect(runningRuns(found, { session: 'A' }, () => 'ended')).toEqual([]);
  });

  it('終了行の無い開始行で token が合う → 行は増えない', () => {
    const found = place();
    appendRun(found, record({ session: 'A', subagent: 'consult-1', pid: 11, token: 'a' }));
    expect(closeOrphans(found, 'A', () => 'running')).toEqual([]);
    expect(readRuns(found, { session: 'A' })).toHaveLength(1);
  });

  it('token 無しの古い行で pid が死んでいる → 終了行を書く', () => {
    const found = place();
    appendRun(found, record({ session: 'A', subagent: 'consult-1', pid: 999_999 }));
    const closed = closeOrphans(found, 'A');
    expect(closed).toHaveLength(1);
    expect(closed[0]).toMatchObject({ state: 'error' });
  });

  it('行が無い → 何も書かない', () => {
    const found = place();
    expect(closeOrphans(found, 'A', () => 'ended')).toEqual([]);
    expect(readRuns(found, { session: 'A' })).toEqual([]);
  });

  it('終了行が既にある → 新しい行を書かない', () => {
    const found = place();
    appendRun(found, record({ session: 'A', subagent: 'consult-1', pid: process.pid }));
    appendRun(
      found,
      record({
        session: 'A',
        subagent: 'consult-1',
        pid: process.pid,
        ended: 2000,
        state: 'done',
      }),
    );
    expect(closeOrphans(found, 'A', () => 'running')).toEqual([]);
    expect(readRuns(found, { session: 'A' })).toHaveLength(2);
  });

  it('appendRun が投げる → 例外はそのまま（呼ぶ側の index.ts が握る）', () => {
    const found = place();
    appendRun(found, record({ session: 'A', subagent: 'consult-1', pid: 11, token: 'a' }));
    const file = dayFile(found, new Date());
    chmodSync(file, 0o444);
    try {
      expect(() => closeOrphans(found, 'A', () => 'ended')).toThrow();
    } finally {
      chmodSync(file, 0o644);
    }
  });

  it('check が unknown → 終了行を書かない（走っている側）', () => {
    const found = place();
    appendRun(
      found,
      record({
        session: 'A',
        subagent: 'consult-1',
        pid: 11,
        startToken: 'Wed Oct 21 12:41:12 2026',
      }),
    );
    const closed = closeOrphans(found, 'A', () => 'unknown');
    expect(closed).toEqual([]);
    expect(readRuns(found, { session: 'A' })).toHaveLength(1);
  });

  it('token 無し + pidAlive が true → 閉じない', () => {
    const found = place();
    appendRun(found, record({ session: 'A', subagent: 'consult-1', pid: process.pid }));
    expect(closeOrphans(found, 'A')).toEqual([]);
    expect(readRuns(found, { session: 'A' })).toHaveLength(1);
  });

  it('閉じた行 → ended が数値、reason が空でない文字列', () => {
    const found = place();
    appendRun(found, record({ session: 'A', subagent: 'consult-1', pid: 11, token: 'a' }));
    const closed = closeOrphans(found, 'A', () => 'ended');
    expect(typeof closed[0]?.ended).toBe('number');
    expect(typeof closed[0]?.reason).toBe('string');
    expect((closed[0]?.reason ?? '').length).toBeGreaterThan(0);
  });
});
