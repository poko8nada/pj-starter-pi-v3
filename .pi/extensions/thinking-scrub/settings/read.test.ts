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
  it('ファイルが無い → ok で既定', () => {
    expect(readSettings(tempDir())).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it('ファイルがディレクトリ → broken', () => {
    const dir = tempDir();
    mkdirSync(join(dir, 'settings.json'));
    expect(readSettings(dir).kind).toBe('broken');
  });

  it('途中で切れた JSON を書いたファイル → broken', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), truncatedJson());
    expect(readSettings(dir).kind).toBe('broken');
  });
});
