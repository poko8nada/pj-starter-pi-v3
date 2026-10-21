import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { dayFile, placeFor, type Place } from './place.ts';
import {
  appendRun,
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
    expect(isRunning(record({ pid: 42 }), () => true)).toBe(true);
  });

  it('終わりの行があれば、pid が生きていても false', () => {
    expect(isRunning(record({ pid: 42, ended: 2000, state: 'done' }), () => true)).toBe(false);
  });

  it('pid が死んでいれば、終わりの行が無くても false（メインエージェントごと落ちたサブエージェント）', () => {
    expect(isRunning(record({ pid: 42 }), () => false)).toBe(false);
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
});
