import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KEEP_RECENT_TOKENS,
  MAX_THRESHOLD_RATIO,
  MIN_THRESHOLD_RATIO,
} from './constants.ts';
import { defaultSettings, parseSettings } from './schema.ts';

describe('parseSettings', () => {
  it('空の文書なら既定の 3 値になる', () => {
    expect(parseSettings('{}')).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it('2 値を書けばその 2 値と既定の enabled になる', () => {
    const keep = DEFAULT_KEEP_RECENT_TOKENS * 2;
    const ratio = (MIN_THRESHOLD_RATIO + MAX_THRESHOLD_RATIO) / 2;
    const read = parseSettings(JSON.stringify({ keepRecentTokens: keep, thresholdRatio: ratio }));
    expect(read).toEqual({
      kind: 'ok',
      settings: { enabled: true, keepRecentTokens: keep, thresholdRatio: ratio },
    });
  });

  it('知らないキーなら broken になる', () => {
    expect(parseSettings('{"unknown":1}').kind).toBe('broken');
  });
});
