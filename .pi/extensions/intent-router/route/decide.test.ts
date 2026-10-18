import { describe, expect, it } from 'vitest';
import type { Answer } from '../ask/ask.ts';
import { defaultSettings } from '../settings/schema.ts';
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

  it('approve 0.85 → idle（0.9 に届かない）', () => {
    expect(decideRoute(choiceAnswer('approve', 0.85), defaultSettings())).toMatchObject({
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
  it('reply の guide を返す', () => {
    const settings = defaultSettings();
    expect(guideText(settings, 'reply')).toBe(settings.route.guides.reply);
  });

  it('approve の guide を返す', () => {
    const settings = defaultSettings();
    expect(guideText(settings, 'approve')).toBe(settings.route.guides.approve);
  });
});
