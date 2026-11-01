import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { readSettings, writeEnabled } from './read.ts';
import { defaultSettings } from './schema.ts';

describe('readSettings', () => {
  it('ファイルがなければ既定値になる', () => {
    expect(readSettings(tempDir())).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it('有効な JSON ならその値になる', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), '{"enabled":false}');
    const read = readSettings(dir);
    expect(read.kind).toBe('ok');
    if (read.kind !== 'ok') {
      throw new Error('must be ok');
    }
    expect(read.settings.enabled).toBe(false);
  });

  it('壊れた JSON なら broken になる', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), '{');
    expect(readSettings(dir).kind).toBe('broken');
  });

  it('ファイルなしで writeEnabled(false) を呼ぶと enabled だけの文書ができ読み直せる', () => {
    const dir = tempDir();
    expect(writeEnabled(dir, false).kind).toBe('ok');
    const raw = JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8')) as unknown;
    expect(raw).toEqual({ enabled: false });
    const read = readSettings(dir);
    expect(read.kind).toBe('ok');
    if (read.kind !== 'ok') {
      throw new Error('must be ok');
    }
    expect(read.settings.enabled).toBe(false);
  });
});
