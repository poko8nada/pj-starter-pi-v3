import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { tmpDir } from '../../../test/tmp.ts';
import {
  PARENT_UNIT,
  appendRun,
  logPath,
  parseRun,
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
  return { child: 'second-opinion-1', role: 'opinion', pid: process.pid, started: 1000, ...extra };
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
  it('開始の1行と終了の1行が書かれ、readRuns で読める', () => {
    const root = makeRoot();
    appendRun(root, record({ started: 1000 }));
    appendRun(root, record({ started: 1000, ended: 2000, state: 'done' }));
    const runs = readRuns(root);
    expect(runs).toHaveLength(2);
    expect(runs[1]).toMatchObject({ state: 'done' });
  });

  it('同じ unit に2件目を足しても1件目が消えない（追記で、上書きしない）', () => {
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

  it('unit をまたいで、始まった順に返す', () => {
    const root = makeRoot();
    appendRun(root, record({ worktree: '2-b', started: 2000, child: 'second-opinion-2' }));
    appendRun(root, record({ started: 1000, child: 'second-opinion-1' }));
    expect(readRuns(root).map((run) => run.child)).toEqual([
      'second-opinion-1',
      'second-opinion-2',
    ]);
  });
});

describe('parseRun', () => {
  it('壊れた行 → undefined', () => {
    expect(parseRun('これは JSON ではない')).toBeUndefined();
    expect(parseRun('')).toBeUndefined();
  });

  it('形の違う行（pid が文字列）→ undefined', () => {
    expect(parseRun('{"child":"c","role":"r","pid":"1","started":2}')).toBeUndefined();
  });

  it('形の違う行（state が未知の語）→ undefined', () => {
    expect(
      parseRun('{"child":"c","role":"r","pid":1,"started":2,"state":"flying"}'),
    ).toBeUndefined();
  });
});

describe('ファイルの置き場', () => {
  it('追記すると unit のディレクトリが作られる', () => {
    const root = makeRoot();
    appendRun(root, record({ worktree: '3-c' }));
    expect(existsSync(join(root, '3-c'))).toBe(true);
  });
});
