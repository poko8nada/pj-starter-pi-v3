import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import {
  appendDelivered,
  CURSOR_FILE,
  pendingReports,
  pruneCursors,
  readCursor,
} from './delivery.ts';
import { appendRun, KEEP_DAYS, type RunRecord } from './log.ts';
import { placeFor, type Place } from './place.ts';

// サブエージェントは起こさない。使い捨ての置き場だけで試す。

function place(): Place {
  return placeFor(tmpDir(), tmpDir());
}

function record(extra: Partial<RunRecord> = {}): RunRecord {
  return {
    session: 'session-a',
    subagent: 'consult-1',
    role: 'review',
    pid: 1,
    started: 1000,
    ended: 2000,
    state: 'done',
    ...extra,
  };
}

/** 目録の欄を直接書く。`writeCursor` は無いので、file を書く */
function writeCursorFile(found: Place, entries: Record<string, number>): void {
  const index: Record<string, { ended: number }> = {};
  for (const [session, ended] of Object.entries(entries)) {
    index[session] = { ended };
  }
  mkdirSync(found.dir, { recursive: true });
  writeFileSync(join(found.dir, CURSOR_FILE), JSON.stringify(index));
}

/** その日に通知つきの行を書く。`ended` は呼び側が決める */
function notice(found: Place, at: Date, extra: Partial<RunRecord> = {}): RunRecord {
  const run = record({ notice: 'できた', ...extra });
  appendRun(found, run, at);
  return run;
}

describe('readCursor', () => {
  it('欄が無ければ undefined', () => {
    expect(readCursor(place(), 'session-a')).toBeUndefined();
  });

  it('壊れている（JSON でない）→ undefined（全部返す側に倒れる）', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    notice(found, at, { ended: 2000, subagent: 'consult-1' });
    writeCursorFile(found, { 'session-a': 9999 });
    writeFileSync(join(found.dir, CURSOR_FILE), 'これは JSON ではない');
    expect(readCursor(found, 'session-a')).toBeUndefined();
    expect(pendingReports(found, { at, session: 'session-a' }).map((run) => run.subagent)).toEqual([
      'consult-1',
    ]);
  });
});

describe('pendingReports', () => {
  it('印の無い完了の行 → その行を返す', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    notice(found, at, { ended: 2000, subagent: 'consult-1' });
    expect(pendingReports(found, { at, session: 'session-a' }).map((run) => run.subagent)).toEqual([
      'consult-1',
    ]);
  });

  it('appendDelivered の後 → 返さない', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    const done = notice(found, at, { ended: 2000, subagent: 'consult-1' });
    expect(pendingReports(found, { at, session: 'session-a' })).toHaveLength(1);
    appendDelivered(found, done, at);
    expect(pendingReports(found, { at, session: 'session-a' })).toEqual([]);
  });

  it('古い目録 { ended: 2000 }、ended: 2000 の完了 → 返さない。ended: 2001 → 返す', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    notice(found, at, { ended: 2000, subagent: 'consult-1' });
    notice(found, at, { ended: 2001, subagent: 'consult-2' });
    writeCursorFile(found, { 'session-a': 2000 });
    expect(pendingReports(found, { at, session: 'session-a' }).map((run) => run.subagent)).toEqual([
      'consult-2',
    ]);
  });

  it('行が 0 本 → 空', () => {
    expect(pendingReports(place(), { session: 'session-a' })).toEqual([]);
  });

  it('印の無い完了が 2 行（started: 1000、2000）→ 古い順に 2 行返す', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    notice(found, at, { started: 2000, ended: 2100, subagent: 'consult-2' });
    notice(found, at, { started: 1000, ended: 1100, subagent: 'consult-1' });
    expect(pendingReports(found, { at, session: 'session-a' }).map((run) => run.subagent)).toEqual([
      'consult-1',
      'consult-2',
    ]);
  });

  it('印の無い完了が別の session に 1 行 → scope.session の行だけ返す', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    notice(found, at, { session: 'session-b', ended: 2000, subagent: 'consult-b' });
    notice(found, at, { session: 'session-a', ended: 3000, subagent: 'consult-a' });
    writeCursorFile(found, { 'session-b': 9999 });
    expect(pendingReports(found, { at, session: 'session-a' }).map((run) => run.subagent)).toEqual([
      'consult-a',
    ]);
  });

  it('開始行（ended 無し）と、notice の無い終わりの行 → どちらも返さない', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    appendRun(found, record({ subagent: 'consult-start', ended: undefined }), at);
    appendRun(found, record({ subagent: 'consult-plain', ended: 1500 }), at);
    expect(pendingReports(found, { at, session: 'session-a' })).toEqual([]);
  });
});

describe('pruneCursors', () => {
  it('古い ended の欄を消し、新しい欄を残す', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    const old = new Date(2026, 8, 1, 12, 0);
    writeCursorFile(found, { 'session-old': old.getTime(), 'session-new': at.getTime() });

    pruneCursors(found, at, KEEP_DAYS);

    expect(readCursor(found, 'session-old')).toBeUndefined();
    expect(readCursor(found, 'session-new')).toEqual({ ended: at.getTime() });
  });
});
