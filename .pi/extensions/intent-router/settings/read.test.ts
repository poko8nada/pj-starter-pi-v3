import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { defaultSettings } from './schema.ts';
import { readSettings } from './read.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

describe('readSettings', () => {
  it('settings.json が無い → 既定を返す', () => {
    expect(readSettings(tmpDir())).toEqual(defaultSettings());
  });

  it('置いたファイルが読める → 既定と同じ値になる', () => {
    const committed = readSettings(join(HERE, '..'));
    expect(committed).toEqual(defaultSettings());
    // ファイル自体が route.thresholds と classifier を既定と同じ値で持つことも見る
    const parsed: unknown = JSON.parse(readFileSync(join(HERE, '../settings.json'), 'utf8'));
    expect(parsed).toMatchObject({ route: { thresholds: defaultSettings().route.thresholds } });
    expect(parsed).toMatchObject({
      classifier: {
        models: [...defaultSettings().classifier.models],
        allowPaid: true,
      },
    });
  });

  it('ファイルを書き換えてからもう一度呼ぶ → 新しい値が返る', () => {
    const dir = tmpDir();
    writeFileSync(
      join(dir, 'settings.json'),
      JSON.stringify({ route: { thresholds: { approve: 0.9 } } }),
    );
    expect(readSettings(dir).route.thresholds.approve).toBe(0.9);
    writeFileSync(
      join(dir, 'settings.json'),
      JSON.stringify({ route: { thresholds: { approve: 0.7 } } }),
    );
    expect(readSettings(dir).route.thresholds.approve).toBe(0.7);
  });

  it('知らないキーを書く → 投げる', () => {
    const dir = tmpDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ unknownKey: 1 }));
    expect(() => readSettings(dir)).toThrow(/unknownKey/);
  });

  it('壊れた settings.json → 投げる', () => {
    const dir = tmpDir();
    writeFileSync(join(dir, 'settings.json'), '{');
    expect(() => readSettings(dir)).toThrow(/not valid JSON/);
  });
});
