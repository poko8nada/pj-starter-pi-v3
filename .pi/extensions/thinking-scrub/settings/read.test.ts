import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { readSettings } from './read.ts';
import { defaultSettings } from './schema.ts';

function truncatedJson(): string {
  return '{"enabled":';
}

describe('readSettings', () => {
  it('3 グループを持つファイルなら ok になる', () => {
    const dir = tempDir();
    const settings = defaultSettings();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify(settings));
    expect(readSettings(dir)).toEqual({ kind: 'ok', settings });
  });

  it('ファイルがなければ ok で既定値になる', () => {
    expect(readSettings(tempDir())).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it('ファイルがディレクトリなら broken になる', () => {
    const dir = tempDir();
    mkdirSync(join(dir, 'settings.json'));
    expect(readSettings(dir).kind).toBe('broken');
  });

  it('途中で切れた JSON を書いたファイルなら broken になる', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), truncatedJson());
    expect(readSettings(dir).kind).toBe('broken');
  });
});
