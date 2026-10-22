import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import type { PrunePass } from '../entry/data.ts';
import { defaultSettings } from '../settings/schema.ts';
import { parseCommand, statusLines, usageText, writeEnabled, type Status } from './prune.ts';

function statusOf(overrides: Partial<Status>): Status {
  return { running: false, failures: 0, lastPass: undefined, ...overrides };
}

function passOf(at: number): PrunePass {
  return {
    at,
    tokensBefore: 60000,
    summary: 'テストの要約',
    dropped: [
      { id: 'e1', chars: 1000 },
      { id: 'e2', chars: 234 },
    ],
    droppedChars: 1234,
    kept: 1,
    latencyMs: 1200,
    usage: undefined,
  };
}

describe('parseCommand', () => {
  it("'' → status", () => {
    expect(parseCommand('')).toEqual({ kind: 'status' });
  });

  it("'on' → on", () => {
    expect(parseCommand('on')).toEqual({ kind: 'on' });
  });

  it("'off' → off", () => {
    expect(parseCommand('off')).toEqual({ kind: 'off' });
  });

  it("'now' → now", () => {
    expect(parseCommand('now')).toEqual({ kind: 'now' });
  });

  it("' on ' → on（前後の空白は落とす）", () => {
    expect(parseCommand(' on ')).toEqual({ kind: 'on' });
  });

  it("'ON' と 'on now' と 'stop' → usage", () => {
    expect(parseCommand('ON')).toEqual({ kind: 'usage' });
    expect(parseCommand('on now')).toEqual({ kind: 'usage' });
    expect(parseCommand('stop')).toEqual({ kind: 'usage' });
    expect(usageText()).toContain('/prune');
  });
});

describe('writeEnabled', () => {
  it('off と on → enabled が切り替わる', () => {
    const dir = tmpDir();
    writeEnabled(dir, false);
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toMatchObject({
      enabled: false,
    });
    writeEnabled(dir, true);
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toMatchObject({
      enabled: true,
    });
  });

  it('ratio を書いておく → 書き換え後も ratio が残る', () => {
    const dir = tmpDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ ratio: 0.6 }));
    writeEnabled(dir, false);
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toMatchObject({
      enabled: false,
      ratio: 0.6,
    });
  });
});

describe('statusLines', () => {
  it('5 行（prune、ratio、last、dropped、failures）', () => {
    const now = 100000;
    const lines = statusLines(
      statusOf({ lastPass: passOf(now - 5000), failures: 1 }),
      defaultSettings(),
      now,
    );
    expect(lines).toEqual([
      'prune: on',
      'ratio: 0.5',
      'last: 5 秒前',
      'dropped: 2 件 (1,234 文字)',
      'failures: 1',
    ]);
  });

  it('直近のパスが無い → last なし、dropped なし', () => {
    expect(statusLines(statusOf({}), defaultSettings(), 100000)).toEqual([
      'prune: on',
      'ratio: 0.5',
      'last: なし',
      'dropped: なし',
      'failures: 0',
    ]);
  });

  it('off・ratio 0.6・failures 2・直近パスあり → 5 行を固定', () => {
    const now = 100000;
    const settings = { ...defaultSettings(), enabled: false, ratio: 0.6 };
    const lines = statusLines(
      statusOf({ lastPass: passOf(now - 5000), failures: 2 }),
      settings,
      now,
    );
    expect(lines).toEqual([
      'prune: off',
      'ratio: 0.6',
      'last: 5 秒前',
      'dropped: 2 件 (1,234 文字)',
      'failures: 2',
    ]);
  });
});
