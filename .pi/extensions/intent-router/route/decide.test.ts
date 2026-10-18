import { describe, expect, it } from 'vitest';
import type { Answer } from '../ask/ask.ts';
import { defaultSettings, type Settings } from '../settings/schema.ts';
import { decideRoute, guideText } from './decide.ts';

function choiceAnswer(choice: string, confidence: number): Answer {
  return { type: 'choice', choice, probabilities: { [choice]: confidence }, confidence };
}

describe('decideRoute', () => {
  it('expect が reply 0.87 → act で reply', () => {
    const decision = decideRoute(choiceAnswer('reply', 0.87), defaultSettings());
    expect(decision).toMatchObject({ kind: 'act', choice: 'reply', confidence: 0.87 });
  });

  it('expect が approve 0.92 → act で approve', () => {
    const decision = decideRoute(choiceAnswer('approve', 0.92), defaultSettings());
    expect(decision).toMatchObject({ kind: 'act', choice: 'approve', confidence: 0.92 });
  });

  it('approve 0.75 → idle（0.8 に届かない）', () => {
    expect(decideRoute(choiceAnswer('approve', 0.75), defaultSettings())).toMatchObject({
      kind: 'idle',
    });
  });

  it('reply 0.8 → act（閾値と同じ値は出る）', () => {
    expect(decideRoute(choiceAnswer('reply', 0.8), defaultSettings())).toMatchObject({
      kind: 'act',
    });
  });

  it('other → idle（文を出さない）', () => {
    expect(decideRoute(choiceAnswer('other', 0.5), defaultSettings())).toMatchObject({
      kind: 'idle',
      choice: 'other',
    });
  });

  it('答えが choice でない → skip', () => {
    expect(
      decideRoute({ type: 'score', score: 1.8, confidence: 0.9 }, defaultSettings()),
    ).toMatchObject({ kind: 'skip' });
  });

  it('choice が知らない文字列（weird）→ skip', () => {
    expect(decideRoute(choiceAnswer('weird', 0.9), defaultSettings())).toMatchObject({
      kind: 'skip',
    });
  });
});

describe('guideText', () => {
  it('reply と approve で文面を選ぶ', () => {
    const settings = defaultSettings();
    expect(guideText(settings, 'reply', 'hello')).toBe(
      settings.route.guides.reply.split('{prompt}').join('hello'),
    );
    expect(guideText(settings, 'approve', 'hello')).toBe(
      settings.route.guides.approve.split('{prompt}').join('hello'),
    );
  });

  it('文面を差し替えると出る文が変わる（固定文字列では緑にならない）', () => {
    const base = defaultSettings();
    const settings: Settings = {
      ...base,
      route: {
        ...base.route,
        guides: { reply: '独自の返信文', approve: '独自の承認文' },
      },
    };
    expect(guideText(settings, 'reply', 'hello')).toBe('独自の返信文');
    expect(guideText(settings, 'approve', 'hello')).toBe('独自の承認文');
  });

  it('改行は1つの空白に潰れて40字で切れる', () => {
    const base = defaultSettings();
    const settings: Settings = {
      ...base,
      route: {
        ...base.route,
        guides: { reply: 'X{prompt}Y', approve: 'Z{prompt}W' },
      },
    };
    expect(guideText(settings, 'reply', `a\nb\nc${'x'.repeat(100)}`)).toBe(
      `Xa b c${'x'.repeat(35)}Y`,
    );
  });
});
