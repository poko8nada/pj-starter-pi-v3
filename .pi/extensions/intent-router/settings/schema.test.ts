import { describe, expect, it } from 'vitest';
import { choicesOf, JUDGE_QUESTIONS, LABELS, ROUTE_QUESTION } from '../ask/questions.ts';
import { defaultSettings, parseSettings } from './schema.ts';

describe('defaultSettings', () => {
  it('thresholds が 0.5 / 0.5 / 1.5（旧道）', () => {
    expect(defaultSettings().thresholds).toEqual({
      routeConfidence: 0.5,
      judgeConfidence: 0.5,
      judgeScore: 1.5,
    });
  });

  it('route.thresholds が reply 0.8 / approve 0.9', () => {
    expect(defaultSettings().route.thresholds).toEqual({ reply: 0.8, approve: 0.9 });
  });

  it('judge.threshold が 0.9', () => {
    expect(defaultSettings().judge.threshold).toBe(0.9);
  });

  it('第一候補が opencode/jev-1.13-free', () => {
    expect(defaultSettings().classifier.models[0]).toEqual({
      provider: 'opencode',
      model: 'jev-1.13-free',
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
    expect(parsed.route.question).toEqual(defaults.route.question);
  });

  it('空 → 既定と等しい（欠けは誤りではない）', () => {
    const defaults = defaultSettings();
    expect(parseSettings('{}', defaults)).toEqual(defaults);
    expect(parseSettings('{"route":{}}', defaults)).toEqual(defaults);
  });

  it('打ち間違いのキー → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"route":{"enabledd":false}}', defaults)).toThrow(/route.enabledd/);
  });

  it('知らないキー → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"route":{"unknownKey":1}}', defaults)).toThrow(/unknownKey/);
  });

  it('routeConfidence が 0〜1 の外 → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"thresholds":{"routeConfidence":1.5}}', defaults)).toThrow(
      /thresholds.routeConfidence.*must be <= 1/,
    );
  });

  it('routeConfidence 1 は通り、maxStateChars 0 は投げる', () => {
    const defaults = defaultSettings();
    expect(
      parseSettings('{"thresholds":{"routeConfidence":1}}', defaults).thresholds.routeConfidence,
    ).toBe(1);
    expect(() => parseSettings('{"budget":{"maxStateChars":0}}', defaults)).toThrow(
      /budget.maxStateChars.*must be >= 1/,
    );
  });

  it('judgeScore は 0〜2（2.5 は投げ、0 は通る）', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"thresholds":{"judgeScore":2.5}}', defaults)).toThrow(
      /thresholds.judgeScore.*must be <= 2/,
    );
    expect(parseSettings('{"thresholds":{"judgeScore":0}}', defaults).thresholds.judgeScore).toBe(
      0,
    );
  });

  it('judgeConfidence が 0〜1 の外 → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"thresholds":{"judgeConfidence":1.2}}', defaults)).toThrow(
      /thresholds.judgeConfidence.*must be <= 1/,
    );
  });

  it('maxFires が非整数 → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"judge":{"maxFires":1.5}}', defaults)).toThrow(/integer/);
  });

  it('thresholds.approve に 1.5 を書く → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"route":{"thresholds":{"approve":1.5}}}', defaults)).toThrow(
      /approve/,
    );
  });

  it('route.question.criteria から other を抜く → 投げる', () => {
    const defaults = defaultSettings();
    expect(() =>
      parseSettings(
        '{"route":{"question":{"instructions":"x","criteria":{"reply":"a","approve":"b"}}}}',
        defaults,
      ),
    ).toThrow(/other/);
  });

  it('壊れた JSON → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{', defaults)).toThrow(/not valid JSON/);
  });
});

describe('questions', () => {
  it('LABELS が6つ', () => {
    expect(LABELS).toHaveLength(6);
  });

  it('ROUTE_QUESTION が expect', () => {
    expect(ROUTE_QUESTION).toBe('expect');
  });

  it('JUDGE_QUESTIONS が useful と new', () => {
    expect(JUDGE_QUESTIONS).toEqual({ useful: 'useful', new: 'new' });
  });

  it('choicesOf(settings.route.question) → reply, approve, other', () => {
    expect(choicesOf(defaultSettings().route.question)).toEqual(['reply', 'approve', 'other']);
  });
});
