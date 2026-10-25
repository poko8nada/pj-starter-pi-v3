import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  pruneFailure,
  prunePass,
  pruneSettings,
  pruneStatus,
  settingsJson,
} from '../../../../test/prune-fixture.ts';
import { tempDir } from '../../../../test/temp-dir.ts';
import { formatCount } from '../format/count.ts';
import { parseCommand, statusLines, usageText, writeEnabled } from './prune.ts';

describe('parseCommand', () => {
  it(`'' → status`, () => {
    const input = '';
    expect(parseCommand(input)).toEqual({ kind: 'status' });
  });

  it(`on / off / now → それぞれの命令`, () => {
    const cases = ['on', 'off', 'now'] as const;
    for (const input of cases) {
      expect(parseCommand(input)).toEqual({ kind: input });
    }
  });

  it(`' on ' → 前後の空白を落として on`, () => {
    const input = ' on ';
    expect(parseCommand(input)).toEqual({ kind: 'on' });
  });

  it(`'ON' と 'on now' と 'stop' → usage`, () => {
    const inputs = ['ON', 'on now', 'stop'];
    for (const input of inputs) {
      expect(parseCommand(input)).toEqual({ kind: 'usage' });
    }
    expect(usageText()).toContain('/prune');
  });
});

describe('writeEnabled', () => {
  it('ファイルが無い + on → enabled 真ができ、ok', () => {
    const dir = tempDir();
    const enabled = true;
    expect(writeEnabled(dir, enabled)).toEqual({ kind: 'ok' });
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({
      enabled,
    });
  });

  it('ratio あり + off → ratio が残り enabled が偽、ok', () => {
    const dir = tempDir();
    const ratio = 0.6;
    const enabled = false;
    writeFileSync(join(dir, 'settings.json'), settingsJson({ ratio }));
    expect(writeEnabled(dir, enabled)).toEqual({ kind: 'ok' });
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toMatchObject({
      enabled,
      ratio,
    });
  });

  it(`'{' + on → failed、ファイルの文字列がそのまま`, () => {
    const dir = tempDir();
    const input = '{';
    const enabled = true;
    writeFileSync(join(dir, 'settings.json'), input);
    const outcome = writeEnabled(dir, enabled);
    expect(outcome.kind).toBe('failed');
    expect(readFileSync(join(dir, 'settings.json'), 'utf8')).toBe(input);
  });

  it(`'[]' + on → failed、ファイルの文字列がそのまま`, () => {
    const dir = tempDir();
    const input = '[]';
    const enabled = true;
    writeFileSync(join(dir, 'settings.json'), input);
    const outcome = writeEnabled(dir, enabled);
    expect(outcome.kind).toBe('failed');
    expect(readFileSync(join(dir, 'settings.json'), 'utf8')).toBe(input);
  });

  it('既に enabled 真で on → ok で同じ内容', () => {
    const dir = tempDir();
    const enabled = true;
    writeFileSync(join(dir, 'settings.json'), settingsJson({ enabled }));
    expect(writeEnabled(dir, enabled)).toEqual({ kind: 'ok' });
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({ enabled });
  });
});

describe('statusLines', () => {
  it('直近のパスあり → prune、ratio、last、dropped、failures の 5 行', () => {
    const settings = pruneSettings();
    const pass = prunePass();
    const failures = 1;
    const now = pass.at + 5000;
    const elapsed = Math.floor((now - pass.at) / 1000);
    const lines = statusLines(pruneStatus({ lastPass: pass, failures }), settings, now);
    expect(lines).toEqual([
      `prune: ${settings.enabled ? 'on' : 'off'}`,
      `ratio: ${settings.ratio}`,
      `last: ${elapsed} 秒前`,
      `dropped: ${pass.dropped.length} 件 (${formatCount(pass.droppedChars)} 文字)`,
      `failures: ${failures}`,
    ]);
  });

  it('直近のパスが無い → last と dropped はなしの 5 行', () => {
    const settings = pruneSettings();
    const failures = 0;
    const lines = statusLines(pruneStatus(), settings, 100000);
    expect(lines).toEqual([
      `prune: ${settings.enabled ? 'on' : 'off'}`,
      `ratio: ${settings.ratio}`,
      'last: なし',
      'dropped: なし',
      `failures: ${failures}`,
    ]);
  });

  it('off・ratio あり・failures あり・直近パスあり → 5 行', () => {
    const settings = pruneSettings({ enabled: false, ratio: 0.6 });
    const pass = prunePass();
    const failures = 2;
    const now = pass.at + 5000;
    const elapsed = Math.floor((now - pass.at) / 1000);
    const lines = statusLines(pruneStatus({ lastPass: pass, failures }), settings, now);
    expect(lines).toEqual([
      `prune: ${settings.enabled ? 'on' : 'off'}`,
      `ratio: ${settings.ratio}`,
      `last: ${elapsed} 秒前`,
      `dropped: ${pass.dropped.length} 件 (${formatCount(pass.droppedChars)} 文字)`,
      `failures: ${failures}`,
    ]);
  });

  it('lastFailure あり → 最後の失敗の行に経過秒と理由', () => {
    const settings = pruneSettings();
    const now = 100000;
    const failure = pruneFailure({ at: now - 9000 });
    const lines = statusLines(pruneStatus({ lastFailure: failure }), settings, now);
    const elapsed = Math.floor((now - failure.at) / 1000);
    expect(lines).toHaveLength(6);
    expect(lines[5]).toContain(String(elapsed));
    expect(lines[5]).toContain(failure.reason);
  });
});
