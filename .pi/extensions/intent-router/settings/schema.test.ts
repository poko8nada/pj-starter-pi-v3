import { describe, expect, it } from 'vitest';
import { choicesOf } from '../ask/questions.ts';
import { defaultSettings, parseSettings } from './schema.ts';

describe('defaultSettings', () => {
  it('route.thresholds が reply 0.8 / approve 0.8', () => {
    expect(defaultSettings().route.thresholds).toEqual({ reply: 0.8, approve: 0.8 });
  });

  it('judge.threshold が 0.8', () => {
    expect(defaultSettings().judge.threshold).toBe(0.8);
  });

  it('既定の judge.questions の鍵が related と answerable の 2 つ', () => {
    expect(Object.keys(defaultSettings().judge.questions).toSorted()).toEqual([
      'answerable',
      'related',
    ]);
  });

  it('既定の judge.stop が unrelated: 2、maxNudges: 1、文面の nudge を持つ', () => {
    const stop = defaultSettings().judge.stop;
    expect(stop.unrelated).toBe(2);
    expect(stop.maxNudges).toBe(1);
    expect(typeof stop.nudge).toBe('string');
    expect(stop.nudge.length).toBeGreaterThan(0);
  });

  it('state の既定が textChars 4000 / assistantChars 1000 / maxStateChars 24000', () => {
    const state = defaultSettings().state;
    expect(state.textChars).toBe(4000);
    expect(state.assistantChars).toBe(1000);
    expect(state.maxStateChars).toBe(24000);
  });

  it('既定の log.keepDays が 14', () => {
    expect(defaultSettings().log.keepDays).toBe(14);
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

  it('judge.questions.related だけ書く → answerable は既定のまま', () => {
    const defaults = defaultSettings();
    const parsed = parseSettings(
      '{"judge":{"questions":{"related":{"instructions":"custom"}}}}',
      defaults,
    );
    expect(parsed.judge.questions.related.instructions).toBe('custom');
    expect(parsed.judge.questions.answerable).toEqual(defaults.judge.questions.answerable);
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

  it('judge.threshold が 1.5 → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"judge":{"threshold":1.5}}', defaults)).toThrow(/threshold/);
  });

  it('judge.questions.related.criteria から no を抜く → 投げる', () => {
    const defaults = defaultSettings();
    expect(() =>
      parseSettings(
        '{"judge":{"questions":{"related":{"instructions":"x","criteria":{"yes":"a"}}}}}',
        defaults,
      ),
    ).toThrow(/no/);
  });

  it('judge.stop.consecutive を書く → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"judge":{"stop":{"consecutive":2}}}', defaults)).toThrow(
      /consecutive/,
    );
  });

  it('log を書かない → 既定の 14 のまま', () => {
    const defaults = defaultSettings();
    expect(parseSettings('{}', defaults).log.keepDays).toBe(14);
    expect(parseSettings('{"route":{}}', defaults).log.keepDays).toBe(14);
  });

  it('log.keepDays が 1 → 通る', () => {
    const defaults = defaultSettings();
    expect(parseSettings('{"log":{"keepDays":1}}', defaults).log.keepDays).toBe(1);
  });

  it('log.keepDays が 0 → 投げる', () => {
    const defaults = defaultSettings();
    expect(() => parseSettings('{"log":{"keepDays":0}}', defaults)).toThrow(/keepDays/);
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
  it('choicesOf(settings.route.question) → reply, approve, other', () => {
    expect(choicesOf(defaultSettings().route.question)).toEqual(['reply', 'approve', 'other']);
  });
});
