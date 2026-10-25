import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KEEP_RECENT_TOKENS,
  MAX_THRESHOLD_RATIO,
  MIN_KEEP_RECENT_TOKENS,
  MIN_THRESHOLD_RATIO,
} from './constants.ts';
import { defaultSettings, parseSettings } from './schema.ts';

describe('parseSettings', () => {
  it('{} → 既定の 3 値', () => {
    expect(parseSettings('{}')).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it('2 値を書く → その 2 値と既定の enabled', () => {
    const keep = DEFAULT_KEEP_RECENT_TOKENS * 2;
    const ratio = (MIN_THRESHOLD_RATIO + MAX_THRESHOLD_RATIO) / 2;
    const read = parseSettings(JSON.stringify({ keepRecentTokens: keep, thresholdRatio: ratio }));
    expect(read).toEqual({
      kind: 'ok',
      settings: { enabled: true, keepRecentTokens: keep, thresholdRatio: ratio },
    });
  });

  it('知らないキー → broken', () => {
    expect(parseSettings('{"unknown":1}').kind).toBe('broken');
  });

  it('thresholdRatio が下限未満 → broken', () => {
    expect(parseSettings(JSON.stringify({ thresholdRatio: MIN_THRESHOLD_RATIO - 0.01 })).kind).toBe(
      'broken',
    );
  });

  it('keepRecentTokens が下限未満 → broken', () => {
    expect(
      parseSettings(JSON.stringify({ keepRecentTokens: MIN_KEEP_RECENT_TOKENS - 1 })).kind,
    ).toBe('broken');
  });

  it('JSON でない → broken', () => {
    expect(parseSettings('{').kind).toBe('broken');
  });
});
