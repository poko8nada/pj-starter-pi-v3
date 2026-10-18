import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { append, logPath, prune, type IntentRecord } from './log.ts';

function routeRecord(ownerNow: string, at = '2026-10-20T12:00:00.000Z'): IntentRecord {
  return {
    at,
    hook: 'route',
    owner_now: ownerNow,
    agent_prev: '',
    choice: 'reply',
    confidence: 0.9,
    threshold: 0.8,
    guide: 'guide text',
    verdicts: null,
    unrelated: null,
    nudge: null,
    fired: true,
    state_chars: 10,
    truncated: false,
  };
}

function readLines(file: string): string[] {
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line !== '');
}

describe('logPath', () => {
  it('JST の暦日で名前を作る（2026-10-20T12:00:00Z → 2026-10-20.jsonl）', () => {
    const dir = tmpDir();
    expect(logPath(dir, new Date('2026-10-20T12:00:00.000Z'))).toBe(join(dir, '2026-10-20.jsonl'));
  });

  it('協定時と日付がずれる時刻（JST 2026-10-09 00:30）→ 2026-10-09.jsonl になる', () => {
    const dir = tmpDir();
    expect(logPath(dir, new Date('2026-10-08T15:30:00Z'))).toBe(join(dir, '2026-10-09.jsonl'));
  });

  it('JST の日変わりの前後で名前が変わる（14:59:59Z は 08 日、15:00:00Z は 09 日）', () => {
    const dir = tmpDir();
    expect(logPath(dir, new Date('2026-10-08T14:59:59Z'))).toBe(join(dir, '2026-10-08.jsonl'));
    expect(logPath(dir, new Date('2026-10-08T15:00:00Z'))).toBe(join(dir, '2026-10-09.jsonl'));
  });
});

describe('append', () => {
  it('2 回足す → その日のファイルが 2 行になり、1 行目は消えていない', () => {
    const dir = tmpDir();
    const logDir = join(dir, 'logs');
    append(routeRecord('hello0', '2026-10-20T01:00:00.000Z'), logDir);
    append(routeRecord('hello1', '2026-10-20T02:00:00.000Z'), logDir);
    const file = logPath(logDir, new Date('2026-10-20T12:00:00.000Z'));
    const lines = readLines(file);
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0] ?? '')).toMatchObject({ owner_now: 'hello0' });
    expect(JSON.parse(lines[1] ?? '')).toMatchObject({ owner_now: 'hello1' });
  });

  it('各行が JSON として読めて、記録の 14 の欄を持つ', () => {
    const dir = tmpDir();
    const logDir = join(dir, 'logs');
    append(routeRecord('hello', '2026-10-20T01:00:00.000Z'), logDir);
    const file = logPath(logDir, new Date('2026-10-20T12:00:00.000Z'));
    const lines = readLines(file);
    expect(lines).toHaveLength(1);
    const parsed: unknown = JSON.parse(lines[0] ?? '');
    expect(parsed).toMatchObject({ hook: 'route', owner_now: 'hello' });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 14 欄の鍵を読む
    expect(Object.keys(parsed as Record<string, unknown>).toSorted()).toEqual(
      [
        'agent_prev',
        'at',
        'choice',
        'confidence',
        'fired',
        'guide',
        'hook',
        'nudge',
        'owner_now',
        'state_chars',
        'threshold',
        'truncated',
        'unrelated',
        'verdicts',
      ].toSorted(),
    );
  });

  it('記録の日のファイルに足す（JST 2026-10-09 00:30 → 2026-10-09.jsonl）', () => {
    const dir = tmpDir();
    const logDir = join(dir, 'logs');
    append(routeRecord('hello', '2026-10-08T15:30:00Z'), logDir);
    expect(existsSync(join(logDir, '2026-10-09.jsonl'))).toBe(true);
    expect(existsSync(join(logDir, '2026-10-08.jsonl'))).toBe(false);
  });

  it('日が違う 2 件 → 2 つのファイルに分かれる', () => {
    const dir = tmpDir();
    const logDir = join(dir, 'logs');
    append(routeRecord('first', '2026-10-08T15:30:00Z'), logDir);
    append(routeRecord('second', '2026-10-09T15:30:00Z'), logDir);
    expect(readLines(join(logDir, '2026-10-09.jsonl'))).toHaveLength(1);
    expect(readLines(join(logDir, '2026-10-10.jsonl'))).toHaveLength(1);
  });

  it('ファイルが無い → ディレクトリごと作る', () => {
    const dir = tmpDir();
    const logDir = join(dir, 'not-yet', 'logs');
    expect(existsSync(logDir)).toBe(false);
    append(routeRecord('hello', '2026-10-20T01:00:00.000Z'), logDir);
    expect(readLines(logPath(logDir, new Date('2026-10-20T12:00:00.000Z')))).toHaveLength(1);
  });
});

function touch(dir: string, name: string): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), 'dummy\n', 'utf8');
}

describe('prune', () => {
  it('prune(dir, 14, 2026-10-20) → 2026-10-05 は消え、2026-10-06 は残る', () => {
    const dir = tmpDir();
    const logDir = join(dir, 'logs');
    touch(logDir, '2026-10-05.jsonl');
    touch(logDir, '2026-10-06.jsonl');
    touch(logDir, '2026-10-20.jsonl');
    const removed = prune(logDir, 14, new Date('2026-10-20T12:00:00+09:00'));
    expect(removed).toBe(1);
    expect(existsSync(join(logDir, '2026-10-05.jsonl'))).toBe(false);
    expect(existsSync(join(logDir, '2026-10-06.jsonl'))).toBe(true);
    expect(existsSync(join(logDir, '2026-10-20.jsonl'))).toBe(true);
  });

  it('2 消えたら 2、消えなければ 0 を返す', () => {
    const dir = tmpDir();
    const logDir = join(dir, 'logs');
    touch(logDir, '2026-10-01.jsonl');
    touch(logDir, '2026-10-02.jsonl');
    touch(logDir, '2026-10-20.jsonl');
    expect(prune(logDir, 14, new Date('2026-10-20T12:00:00+09:00'))).toBe(2);
    expect(prune(logDir, 14, new Date('2026-10-20T12:00:00+09:00'))).toBe(0);
  });

  it('日付の名前でないファイル（keep.txt、2026-10-01.json）は消さない', () => {
    const dir = tmpDir();
    const logDir = join(dir, 'logs');
    touch(logDir, 'keep.txt');
    touch(logDir, '2026-10-01.json');
    touch(logDir, '2026-10-20.jsonl');
    expect(prune(logDir, 14, new Date('2026-10-20T12:00:00+09:00'))).toBe(0);
    expect(readdirSync(logDir).toSorted()).toEqual(
      ['2026-10-01.json', '2026-10-20.jsonl', 'keep.txt'].toSorted(),
    );
  });

  it('ディレクトリが無い → 0 を返す', () => {
    const dir = tmpDir();
    expect(prune(join(dir, 'not-yet'), 14, new Date('2026-10-20T12:00:00+09:00'))).toBe(0);
  });
});
