import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pruneSettings, settingsJson } from '../../../../test/prune-fixture.ts';
import { tempDir } from '../../../../test/temp-dir.ts';
import { readSettings } from './read.ts';
import { defaultSettings } from './schema.ts';

describe('readSettings', () => {
  it('ファイルが無い → ok で既定', () => {
    expect(readSettings(tempDir())).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it(`JSON でないファイル → broken`, () => {
    const dir = tempDir();
    const input = '{';
    writeFileSync(join(dir, 'settings.json'), input);
    expect(readSettings(dir).kind).toBe('broken');
  });

  it('enabled を偽に書いて読み、真に書き換えて読み直す → それぞれの値', () => {
    const dir = tempDir();
    const firstEnabled = false;
    writeFileSync(join(dir, 'settings.json'), settingsJson({ enabled: firstEnabled }));
    const first = readSettings(dir);
    expect(first.kind).toBe('ok');
    if (first.kind !== 'ok') {
      throw new Error('first must be ok');
    }
    expect(first.settings).toEqual(pruneSettings({ enabled: firstEnabled }));
    const secondEnabled = true;
    writeFileSync(join(dir, 'settings.json'), settingsJson({ enabled: secondEnabled }));
    const second = readSettings(dir);
    expect(second.kind).toBe('ok');
    if (second.kind !== 'ok') {
      throw new Error('second must be ok');
    }
    expect(second.settings).toEqual(pruneSettings({ enabled: secondEnabled }));
  });
});
