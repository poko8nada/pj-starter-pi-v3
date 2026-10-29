import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { readSettings } from './read.ts';
import { defaultSettings } from './schema.ts';

describe('readSettings', () => {
  it('正常な設定ファイルがある → ok を返す', () => {
    const dir = tempDir();
    const settings = {
      ...defaultSettings(),
      enabled: false,
      sounds: { ...defaultSettings().sounds, commit: 'Basso' },
    };
    writeFileSync(join(dir, 'settings.json'), JSON.stringify(settings));
    expect(readSettings(dir)).toEqual({ kind: 'ok', settings });
  });

  it('ファイルがない → ok で、既定値を返す', () => {
    expect(readSettings(tempDir())).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it('壊れた設定ファイルの JSON → broken を返す', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), '{"enabled":');
    expect(readSettings(dir).kind).toBe('broken');
  });
});
