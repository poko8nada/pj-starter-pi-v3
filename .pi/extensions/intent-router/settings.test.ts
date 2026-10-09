import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';
import { JUDGE_QUESTION, LABELS, ROUTE_QUESTION } from './questions.ts';
import { defaultSettings, parseSettings, readSettings } from './settings.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

describe('defaultSettings', () => {
  it('thresholds が 0.5 / 0.5 / 1.5', () => {
    expect(defaultSettings().thresholds).toEqual({
      routeConfidence: 0.5,
      judgeConfidence: 0.5,
      judgeScore: 1.5,
    });
  });
});

describe('parseSettings', () => {
  it('部分上書き → 書いた欄だけ変わり他は既定のまま', () => {
    const defaults = defaultSettings();
    const parsed = parseSettings('{"thresholds":{"judgeScore":1.8}}', defaults);
    expect(parsed.thresholds.judgeScore).toBe(1.8);
    expect(parsed.thresholds.routeConfidence).toBe(defaults.thresholds.routeConfidence);
    expect(parsed.thresholds.judgeConfidence).toBe(defaults.thresholds.judgeConfidence);
    expect(parsed.budget).toEqual(defaults.budget);
    expect(parsed.route).toEqual(defaults.route);
  });

  it('空 → 既定と等しい（欠けは誤りではない）', () => {
    const defaults = defaultSettings();
    expect(parseSettings('{}', defaults)).toEqual(defaults);
    expect(parseSettings('{"route":{}}', defaults)).toEqual(defaults);
  });

  it('打ち間違いのキー → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"route":{"enabledd":false}}', defaults)).toThrow(/unknown key/);
  });

  it('routeConfidence が 0〜1 の外 → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"thresholds":{"routeConfidence":1.5}}', defaults)).toThrow(
      /between 0 and 1/,
    );
  });

  it('routeConfidence 1 は通り、maxStateChars 0 は投げる', () => {
    const defaults = defaultSettings();
    expect(
      parseSettings('{"thresholds":{"routeConfidence":1}}', defaults).thresholds.routeConfidence,
    ).toBe(1);
    expect(() => parseSettings('{"budget":{"maxStateChars":0}}', defaults)).toThrow(/positive/);
  });

  it('judgeScore は 0〜2（2.5 は投げ、0 は通る）', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"thresholds":{"judgeScore":2.5}}', defaults)).toThrow(
      /between 0 and 2/,
    );
    expect(parseSettings('{"thresholds":{"judgeScore":0}}', defaults).thresholds.judgeScore).toBe(
      0,
    );
  });

  it('judgeConfidence が 0〜1 の外 → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"thresholds":{"judgeConfidence":1.2}}', defaults)).toThrow(
      /between 0 and 1/,
    );
  });

  it('maxFires が非整数 → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"judge":{"maxFires":1.5}}', defaults)).toThrow(/integer/);
  });

  it('壊れた JSON → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{', defaults)).toThrow(/not valid JSON/);
  });
});

describe('readSettings', () => {
  it('settings.json が無い → 既定を返す', () => {
    expect(readSettings(tmpDir(), defaultSettings())).toEqual(defaultSettings());
  });

  it('置いたファイルが読める → 既定と同じ値になる', () => {
    const committed = readSettings(join(HERE), defaultSettings());
    expect(committed).toEqual(defaultSettings());
    // ファイル自体が thresholds と classifier を既定と同じ値で持つことも見る
    const parsed: unknown = JSON.parse(readFileSync(join(HERE, 'settings.json'), 'utf8'));
    expect(parsed).toMatchObject({ thresholds: defaultSettings().thresholds });
    expect(parsed).toMatchObject({
      classifier: {
        models: [...defaultSettings().classifier.models],
        allowPaid: true,
      },
    });
  });

  it('壊れた settings.json → 投げる', () => {
    const dir = tmpDir();
    writeFileSync(join(dir, 'settings.json'), '{');
    expect(() => readSettings(dir, defaultSettings())).toThrow(/not valid JSON/);
  });
});

describe('questions', () => {
  it('LABELS の6つと ROUTE_QUESTION.criteria のキーが一致する', () => {
    expect([...LABELS].toSorted()).toEqual(Object.keys(ROUTE_QUESTION.criteria).toSorted());
    expect(LABELS).toHaveLength(6);
  });

  it('JUDGE_QUESTION.criteria が3本で、1.5 が真ん中と上の間に入る', () => {
    expect(JUDGE_QUESTION.criteria).toHaveLength(3);
    expect(defaultSettings().thresholds.judgeScore).toBeGreaterThan(1);
    expect(defaultSettings().thresholds.judgeScore).toBeLessThan(2);
  });
});
