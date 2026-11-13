import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aAt, aDoneRun, aPlace } from '../consult.fixture.ts';
import { appendDelivered, CURSOR_FILE, pendingReports, readCursor } from './delivery.ts';
import { appendRun, type RunRecord } from './log.ts';
import { type Place } from './place.ts';

// サブエージェントは起こさない。使い捨ての保存場所だけで試す。

/** 一覧の欄を直接書く。`writeCursor` はないので、file を書く */
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
  const run = aDoneRun({ notice: 'できた', ...extra });
  appendRun(found, run, at);
  return run;
}

describe('readCursor', () => {
  it('欄がなければ undefined', () => {
    expect(readCursor(aPlace(), 'session-a')).toBeUndefined();
  });

  it('壊れている（JSON でない）→ undefined', () => {
    const found = aPlace();
    const at = aAt();
    notice(found, at, { ended: 2000, subagent: 'consult-1' });
    writeFileSync(join(found.dir, CURSOR_FILE), 'これは JSON ではない');
    expect(readCursor(found, 'session-a')).toBeUndefined();
  });
});

describe('pendingReports', () => {
  it('印のない完了の行 → その行を返す', () => {
    const found = aPlace();
    const at = aAt();
    const subagent = 'consult-1';
    notice(found, at, { ended: 2000, subagent });
    expect(pendingReports(found, { at, session: 'session-a' }).map((run) => run.subagent)).toEqual([
      subagent,
    ]);
  });

  it('appendDelivered の後 → 返さない', () => {
    const found = aPlace();
    const at = aAt();
    const done = notice(found, at, { ended: 2000, subagent: 'consult-1' });
    expect(pendingReports(found, { at, session: 'session-a' })).toHaveLength(1);
    appendDelivered(found, done, at);
    expect(pendingReports(found, { at, session: 'session-a' })).toEqual([]);
  });

  it('古い一覧 { ended: 2000 }、ended: 2000 の完了 → 返さない。ended: 2001 → 返す', () => {
    const found = aPlace();
    const at = aAt();
    const kept = 'consult-2';
    notice(found, at, { ended: 2000, subagent: 'consult-1' });
    notice(found, at, { ended: 2001, subagent: kept });
    writeCursorFile(found, { 'session-a': 2000 });
    expect(pendingReports(found, { at, session: 'session-a' }).map((run) => run.subagent)).toEqual([
      kept,
    ]);
  });

  it('印のない完了が 2 行（started: 1000、2000）→ 古い順に 2 行返す', () => {
    const found = aPlace();
    const at = aAt();
    const first = 'consult-1';
    const second = 'consult-2';
    notice(found, at, { started: 2000, ended: 2100, subagent: second });
    notice(found, at, { started: 1000, ended: 1100, subagent: first });
    expect(pendingReports(found, { at, session: 'session-a' }).map((run) => run.subagent)).toEqual([
      first,
      second,
    ]);
  });

  it('印のない完了が別の session に 1 行 → scope.session の行だけ返す', () => {
    const found = aPlace();
    const at = aAt();
    const wanted = 'consult-a';
    notice(found, at, { session: 'session-b', ended: 2000, subagent: 'consult-b' });
    notice(found, at, { session: 'session-a', ended: 3000, subagent: wanted });
    writeCursorFile(found, { 'session-b': 9999 });
    expect(pendingReports(found, { at, session: 'session-a' }).map((run) => run.subagent)).toEqual([
      wanted,
    ]);
  });

  it('開始行（ended なし）と、notice のない終わりの行 → どちらも返さない', () => {
    const found = aPlace();
    const at = aAt();
    appendRun(found, aDoneRun({ subagent: 'consult-start', ended: undefined }), at);
    appendRun(found, aDoneRun({ subagent: 'consult-plain', ended: 1500 }), at);
    expect(pendingReports(found, { at, session: 'session-a' })).toEqual([]);
  });
});
