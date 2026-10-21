import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { readSettings } from './read.ts';
import { defaultSettings } from './schema.ts';

describe('readSettings', () => {
  it('ファイルが無い → ok で既定', () => {
    expect(readSettings(tmpDir())).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it('ファイルがディレクトリ → broken', () => {
    const dir = tmpDir();
    mkdirSync(join(dir, 'settings.json'));
    expect(readSettings(dir).kind).toBe('broken');
  });

  it('{"enabled": を書いたファイル → broken', () => {
    const dir = tmpDir();
    writeFileSync(join(dir, 'settings.json'), '{"enabled":');
    expect(readSettings(dir).kind).toBe('broken');
  });
});
