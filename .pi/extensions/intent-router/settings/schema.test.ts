import { describe, expect, it } from 'vitest';
import { choicesOf, JUDGE_QUESTIONS, ROUTE_QUESTION } from '../ask/questions.ts';
import { defaultSettings, parseSettings } from './schema.ts';

describe('defaultSettings', () => {
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
    const parsed = parseSettings('{"route":{"thresholds":{"approve":0.85}}}', defaults);
    expect(parsed.route.thresholds).toEqual({ reply: 0.8, approve: 0.85 });
    expect(parsed.route.question).toEqual(defaults.route.question);
    expect(parsed.judge).toEqual(defaults.judge);
  });

  it('空 → 既定と等しい（欠けは誤りではない）', () => {
    const defaults = defaultSettings();
    expect(parseSettings('{}', defaults)).toEqual(defaults);
    expect(parseSettings('{"route":{}}', defaults)).toEqual(defaults);
  });

  it('知らないキー → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"route":{"unknownKey":1}}', defaults)).toThrow(/unknownKey/);
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
});

describe('questions', () => {
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
