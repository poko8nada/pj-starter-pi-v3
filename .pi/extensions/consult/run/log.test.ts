import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { tmpDir } from '../../../test/tmp.ts';
import {
  PARENT_UNIT,
  appendRun,
  logPath,
  parseRun,
  pidAlive,
  readRuns,
  unitOf,
  type RunRecord,
} from './log.ts';

// root は毎回 tmpDir に逃がす（実物の /tmp/pi-consult を触らない）。

const roots: string[] = [];

function makeRoot(): string {
  const root = tmpDir();
  roots.push(root);
  return root;
}

afterEach(() => {
  roots.length = 0;
});

function record(extra: Partial<RunRecord> = {}): RunRecord {
  return { child: 'consult-1', role: 'review', pid: process.pid, started: 1000, ...extra };
}

describe('unitOf / logPath', () => {
  it('worktree があればその id、無ければ _parent', () => {
    expect(unitOf('2-a')).toBe('2-a');
    expect(unitOf(undefined)).toBe(PARENT_UNIT);
  });

  it('置き場は <root>/<unit>/log.jsonl', () => {
    expect(logPath('/tmp/x', '2-a')).toBe('/tmp/x/2-a/log.jsonl');
  });
});

describe('appendRun / readRuns', () => {
  it('1 行足して読む → その 1 行がそのまま返る', () => {
    const root = makeRoot();
    const run = record({ worktree: '2-a', turns: 12, spend: '0.01 usd' });
    appendRun(root, run);
    expect(readRuns(root)).toEqual([run]);
    expect(
      readFileSync(join(root, '2-a', 'log.jsonl'), 'utf8')
        .trim()
        .split('\n'),
    ).toHaveLength(1);
  });

  it('同じ run を 2 回足す → 2 行になる（追記で、上書きしない）', () => {
    const root = makeRoot();
    appendRun(root, record({ started: 1 }));
    appendRun(root, record({ started: 1 }));
    expect(readRuns(root)).toHaveLength(2);
  });

  it('記録が無い unit（root が無い）→ 空の配列', () => {
    expect(readRuns(join(makeRoot(), 'no-such-root'))).toEqual([]);
  });

  it('壊れた行（JSON でない）→ その行だけ飛ばし、他は読める', () => {
    const root = makeRoot();
    appendRun(root, record({ started: 1 }));
    const file = logPath(root, PARENT_UNIT);
    writeFileSync(file, `${readFileSync(file, 'utf8')}これは JSON ではない\n`);
    appendRun(root, record({ started: 2 }));
    expect(readRuns(root).map((run) => run.started)).toEqual([1, 2]);
  });

  it('形が違う行（child が無い）も飛ばす', () => {
    const root = makeRoot();
    mkdirSync(join(root, PARENT_UNIT), { recursive: true });
    writeFileSync(logPath(root, PARENT_UNIT), '{"role":"review","pid":1,"started":1}\n');
    expect(readRuns(root)).toEqual([]);
  });

  it('unit をまたいで、始まった順に返す', () => {
    const root = makeRoot();
    appendRun(root, record({ worktree: '2-b', started: 2000, child: 'consult-2' }));
    appendRun(root, record({ started: 1000, child: 'consult-1' }));
    expect(readRuns(root).map((run) => run.child)).toEqual(['consult-1', 'consult-2']);
  });

  it('終わりの欄を持つ行はそのまま返る（state と reason）', () => {
    const root = makeRoot();
    appendRun(
      root,
      record({
        ended: 2000,
        state: 'turn-limit',
        reason: 'turn limit reached (40)',
        files: ['a.ts'],
      }),
    );
    expect(readRuns(root)[0]).toMatchObject({
      state: 'turn-limit',
      reason: 'turn limit reached (40)',
      files: ['a.ts'],
    });
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

describe('parseRun', () => {
  it('空行と空白だけの行は undefined', () => {
    expect(parseRun('')).toBeUndefined();
    expect(parseRun('   \n')).toBeUndefined();
  });

  it('本体の欄を上書きしない（worktree を持ち上げた後で、元の値で壊さない）', () => {
    const run = parseRun('{"child":"c","role":"r","pid":1,"started":2,"worktree":"w"}');
    expect(run).toMatchObject({ child: 'c', role: 'r', pid: 1, started: 2, worktree: 'w' });
  });
});

describe('ファイルの置き場', () => {
  it('追記すると unit のディレクトリが作られる', () => {
    const root = makeRoot();
    appendRun(root, record({ worktree: '3-c' }));
    expect(existsSync(join(root, '3-c'))).toBe(true);
  });
});
