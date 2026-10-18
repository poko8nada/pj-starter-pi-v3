import { describe, expect, it } from 'vitest';
import type { Answer } from '../ask/ask.ts';
import { defaultSettings, type Settings } from '../settings/schema.ts';
import { arm, countJudgement, fire, idleRun, noteTurn } from '../state/run.ts';
import { decideJudge, due, stopMessage } from './decide.ts';

const CANDIDATE = { provider: 'opencode', model: 'jev-1.13-free' };

function scoreAnswer(score: number, confidence: number): Answer {
  return { type: 'score', score, confidence };
}

function choiceAnswer(): Answer {
  return { type: 'choice', choice: 'design', probabilities: { design: 0.9 }, confidence: 0.9 };
}

/** arm して noteTurn を回数ぶん重ねた run（turns を進めるのに使う） */
function armedWithTurns(turns: number) {
  let run = arm({
    prompt: 'hello',
    label: 'question',
    confidence: 0.9,
    candidate: CANDIDATE,
    now: 1,
  });
  for (let index = 0; index < turns; index += 1) {
    run = noteTurn(run, `text${index}`, defaultSettings().state);
  }
  return run;
}

function withJudge(settings: Settings, patch: Partial<Settings['judge']>): Settings {
  return { ...settings, judge: { ...settings.judge, ...patch } };
}

describe('decideJudge', () => {
  it('score 1.8 / confidence 0.8 → fire', () => {
    expect(decideJudge(scoreAnswer(1.8, 0.8), defaultSettings().thresholds)).toMatchObject({
      kind: 'fire',
    });
  });

  it('score ちょうど 1.5 / confidence ちょうど 0.5 → fire（閾値は >=）', () => {
    expect(decideJudge(scoreAnswer(1.5, 0.5), defaultSettings().thresholds)).toMatchObject({
      kind: 'fire',
    });
  });

  it('score 1.8 / confidence 0.49 → hold（片方だけ）', () => {
    expect(decideJudge(scoreAnswer(1.8, 0.49), defaultSettings().thresholds)).toMatchObject({
      kind: 'hold',
    });
  });

  it('score 1.49 / confidence 0.9 → hold（片方だけ）', () => {
    expect(decideJudge(scoreAnswer(1.49, 0.9), defaultSettings().thresholds)).toMatchObject({
      kind: 'hold',
    });
  });

  it('choice の答え → skip', () => {
    expect(decideJudge(choiceAnswer(), defaultSettings().thresholds)).toMatchObject({
      kind: 'skip',
    });
  });
});

describe('due', () => {
  it('idle の run → wait', () => {
    expect(due(idleRun(), defaultSettings(), 10)).toMatchObject({ kind: 'wait' });
  });

  it('turns: 1（minTurns: 2）→ wait、turns: 2 → due', () => {
    expect(due(armedWithTurns(1), defaultSettings(), 10)).toMatchObject({ kind: 'wait' });
    expect(due(armedWithTurns(2), defaultSettings(), 10)).toMatchObject({ kind: 'due' });
  });

  it('turns: 3（everyNTurns: 2）→ wait、turns: 4 → due', () => {
    const settings = withJudge(defaultSettings(), { everyNTurns: 2 });
    expect(due(armedWithTurns(3), settings, 10)).toMatchObject({ kind: 'wait' });
    expect(due(armedWithTurns(4), settings, 10)).toMatchObject({ kind: 'due' });
  });

  it('now - lastJudgedAt < minIntervalMs → wait、以上 → due', () => {
    const settings = defaultSettings();
    const judged = countJudgement(armedWithTurns(2), 1000);
    expect(due(judged, settings, 1000 + settings.budget.minIntervalMs - 1)).toMatchObject({
      kind: 'wait',
    });
    expect(due(judged, settings, 1000 + settings.budget.minIntervalMs)).toMatchObject({
      kind: 'due',
    });
  });

  it('fires: 1（maxFires: 1）→ wait', () => {
    const run = fire(armedWithTurns(2));
    expect(due(run, defaultSettings(), 10)).toMatchObject({ kind: 'wait' });
  });

  it('judgements: 12 → wait', () => {
    let run = armedWithTurns(2);
    for (let index = 0; index < 12; index += 1) {
      run = countJudgement(run, 10 + index);
    }
    expect(due(run, defaultSettings(), 100000)).toMatchObject({ kind: 'wait' });
  });
});

describe('stopMessage', () => {
  it('{label} を埋める', () => {
    expect(stopMessage('stop ({label})', 'question')).toBe('stop (question)');
  });
});
