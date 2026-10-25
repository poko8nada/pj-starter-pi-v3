import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { readSettings, writeEnabled } from './read.ts';
import { defaultSettings } from './schema.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

describe('readSettings', () => {
  it('ファイルが無い → 既定', () => {
    expect(readSettings(tempDir())).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it('有効な JSON → その値', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), '{"enabled":false}');
    const read = readSettings(dir);
    expect(read.kind).toBe('ok');
    if (read.kind !== 'ok') {
      throw new Error('must be ok');
    }
    expect(read.settings.enabled).toBe(false);
  });

  it('壊れた JSON → broken', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), '{');
    expect(readSettings(dir).kind).toBe('broken');
  });

  it('ファイル無しで writeEnabled(false) → enabled だけの文書ができ、読み直せる', () => {
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

  it('拡張の settings.json を読む → 既定の 3 値', () => {
    const read = readSettings(join(HERE, '..'));
    expect(read).toEqual({ kind: 'ok', settings: defaultSettings() });
  });
});
