import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { readSettings } from './read.ts';
import { defaultSettings } from './schema.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

describe('readSettings', () => {
  it('ファイルが無い → ok で既定', () => {
    expect(readSettings(tmpDir())).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it("'{' を書いたファイル → broken", () => {
    const dir = tmpDir();
    writeFileSync(join(dir, 'settings.json'), '{');
    expect(readSettings(dir).kind).toBe('broken');
  });

  it('enabled false を書いて読む → ok で偽。true に書き換えて読み直す → 真', () => {
    const dir = tmpDir();
    writeFileSync(join(dir, 'settings.json'), '{"enabled":false}');
    const first = readSettings(dir);
    expect(first.kind).toBe('ok');
    if (first.kind !== 'ok') {
      throw new Error('first must be ok');
    }
    expect(first.settings.enabled).toBe(false);
    writeFileSync(join(dir, 'settings.json'), '{"enabled":true}');
    const second = readSettings(dir);
    expect(second.kind).toBe('ok');
    if (second.kind !== 'ok') {
      throw new Error('second must be ok');
    }
    expect(second.settings.enabled).toBe(true);
  });

  it('拡張の settings.json を読む → ok で ratio 0.5・classifier 2 件', () => {
    const read = readSettings(join(HERE, '..'));
    expect(read.kind).toBe('ok');
    if (read.kind !== 'ok') {
      throw new Error('extension settings must be readable');
    }
    expect(read.settings.ratio).toBe(0.5);
    expect(read.settings.classifier.models).toHaveLength(2);
  });
});
