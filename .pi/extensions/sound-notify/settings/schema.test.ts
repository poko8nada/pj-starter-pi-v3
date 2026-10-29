import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { defaultSettings, parseSettings, settingsOrDefault } from './schema.ts';

describe('parseSettings', () => {
  it('5 種類の sounds とフラグを持つ JSON → ok で、入力値がそのまま返る', () => {
    const input = JSON.stringify({
      enabled: false,
      notifications: false,
      sounds: {
        permission: 'Basso',
        question: 'Blow',
        done: 'Ping',
        commit: 'Glass',
        compact: 'Pop',
      },
    });
    expect(parseSettings(input)).toEqual({
      kind: 'ok',
      settings: {
        enabled: false,
        notifications: false,
        sounds: {
          permission: 'Basso',
          question: 'Blow',
          done: 'Ping',
          commit: 'Glass',
          compact: 'Pop',
        },
      },
    });
  });

  it('{} → ok で、defaultSettings() が返る', () => {
    expect(parseSettings('{}')).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it('../settings.json の既定値が defaultSettings() と一致する', () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const text = readFileSync(join(dir, '..', 'settings.json'), 'utf8');
    expect(parseSettings(text)).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it('enabled が文字列 → broken を返す', () => {
    expect(parseSettings('{"enabled":"yes"}').kind).toBe('broken');
  });

  it('sounds.permission が数値 → broken を返す', () => {
    expect(parseSettings('{"sounds":{"permission":7}}').kind).toBe('broken');
  });

  it('未知のキーを持つ JSON → ok で、未知のキーを無視して既定値と入力値を返す', () => {
    const input = JSON.stringify({ enabled: false, unknown: 1, sounds: { commit: 'Basso' } });
    expect(parseSettings(input)).toEqual({
      kind: 'ok',
      settings: {
        ...defaultSettings(),
        enabled: false,
        sounds: { ...defaultSettings().sounds, commit: 'Basso' },
      },
    });
  });
});

describe('settingsOrDefault', () => {
  it('broken → defaultSettings() を返す', () => {
    expect(
      settingsOrDefault({ kind: 'broken', reason: 'sound-notify settings: must be an object' }),
    ).toEqual(defaultSettings());
  });

  it('ok → その設定をそのまま返す', () => {
    const settings = { ...defaultSettings(), enabled: false };
    expect(settingsOrDefault({ kind: 'ok', settings })).toBe(settings);
  });
});
