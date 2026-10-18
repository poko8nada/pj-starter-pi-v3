import { describe, expect, it } from 'vitest';
import type { Answer } from '../ask/ask.ts';
import { defaultSettings } from '../settings/schema.ts';
import { decideRoute, guideMessage } from './decide.ts';

function choiceAnswer(choice: string, confidence: number): Answer {
  return { type: 'choice', choice, probabilities: { [choice]: confidence }, confidence };
}

describe('decideRoute', () => {
  it('design 0.9 → act', () => {
    const thresholds = defaultSettings().thresholds;
    expect(
      decideRoute(choiceAnswer('design', 0.9), thresholds, ['design'], ['chat']),
    ).toMatchObject({
      kind: 'act',
    });
  });

  it('confidence ちょうど 0.5 → act（閾値は >=）', () => {
    const thresholds = defaultSettings().thresholds;
    expect(
      decideRoute(choiceAnswer('design', 0.5), thresholds, ['design'], ['chat']),
    ).toMatchObject({
      kind: 'act',
    });
  });

  it('confidence 0.49 → idle（閾値の下）', () => {
    const thresholds = defaultSettings().thresholds;
    expect(
      decideRoute(choiceAnswer('design', 0.49), thresholds, ['design'], ['chat']),
    ).toMatchObject({
      kind: 'idle',
    });
  });

  it('chat → idle（動かないラベル）', () => {
    const thresholds = defaultSettings().thresholds;
    expect(decideRoute(choiceAnswer('chat', 0.9), thresholds, ['design'], ['chat'])).toMatchObject({
      kind: 'idle',
    });
  });

  it('actOn にも idleOn にも無いラベル → skip', () => {
    const thresholds = defaultSettings().thresholds;
    expect(
      decideRoute(choiceAnswer('design', 0.9), thresholds, ['question'], ['chat']),
    ).toMatchObject({
      kind: 'skip',
    });
  });

  it('score の答え → skip', () => {
    const thresholds = defaultSettings().thresholds;
    expect(
      decideRoute({ type: 'score', score: 1.8, confidence: 0.9 }, thresholds, ['design'], ['chat']),
    ).toMatchObject({ kind: 'skip' });
  });

  it('知らないラベル文字列 → skip', () => {
    const thresholds = defaultSettings().thresholds;
    expect(decideRoute(choiceAnswer('weird', 0.9), thresholds, ['design'], ['chat'])).toMatchObject(
      { kind: 'skip' },
    );
  });
});

describe('guideMessage', () => {
  it('{prompt} と {label} を埋める', () => {
    expect(guideMessage('Re: {prompt} — kind: {label}.', 'design', 'この設計どう思う')).toBe(
      'Re: この設計どう思う — kind: design.',
    );
  });

  it('改行を潰して 40 字まで', () => {
    expect(guideMessage('{prompt}', 'question', 'a\nb')).toBe('a b');
    expect(guideMessage('{prompt}', 'question', 'あ'.repeat(50)).length).toBe(40);
  });
});
