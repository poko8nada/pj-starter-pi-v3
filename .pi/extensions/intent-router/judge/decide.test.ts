import { describe, expect, it } from 'vitest';
import type { Answer } from '../ask/ask.ts';
import { defaultSettings, type Settings } from '../settings/schema.ts';
import { arm, countJudgement, idleRun, noteTurn, nudge } from '../state/run.ts';
import { decideJudge, due, nudgeText } from './decide.ts';

const CANDIDATE = { provider: 'opencode', model: 'jev-1.13-free' };

function choiceAnswer(choice: string, confidence: number): Answer {
  return { type: 'choice', choice, probabilities: { [choice]: confidence }, confidence };
}

function answers(related: string, relatedConf: number, answerable: string, answerableConf: number) {
  return {
    related: choiceAnswer(related, relatedConf),
    answerable: choiceAnswer(answerable, answerableConf),
  };
}

/** arm して noteTurn を回数ぶん重ねた run（turns を進めるのに使う） */
function armedWithTurns(turns: number) {
  let run = arm({
    ownerNow: 'hello',
    choice: 'reply',
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
  it('related=no かつ answerable=no → nudge', () => {
    expect(decideJudge(answers('no', 0.95, 'no', 0.95), defaultSettings())).toMatchObject({
      kind: 'nudge',
    });
  });

  it('related=yes かつ answerable=no → nudge（answerable だけで促しになる）', () => {
    expect(decideJudge(answers('yes', 0.95, 'no', 0.95), defaultSettings())).toMatchObject({
      kind: 'nudge',
    });
  });

  it('related=no かつ answerable=yes → nudge', () => {
    expect(decideJudge(answers('no', 0.95, 'yes', 0.95), defaultSettings())).toMatchObject({
      kind: 'nudge',
    });
  });

  it('related=yes かつ answerable=yes → wait で streak は 0', () => {
    expect(decideJudge(answers('yes', 0.95, 'yes', 0.95), defaultSettings())).toMatchObject({
      kind: 'wait',
      streak: 0,
    });
  });

  it('related の confidence が 0.79 → 判断に使わず wait', () => {
    expect(decideJudge(answers('no', 0.79, 'no', 0.95), defaultSettings())).toMatchObject({
      kind: 'wait',
    });
  });

  it('choice でない答え → wait', () => {
    expect(
      decideJudge(
        {
          related: { type: 'score', score: 1.8, confidence: 0.9 },
          answerable: choiceAnswer('no', 0.95),
        },
        defaultSettings(),
      ),
    ).toMatchObject({ kind: 'wait' });
  });
});

describe('due', () => {
  it('idle の run → wait', () => {
    expect(due(idleRun(), defaultSettings(), 10)).toMatchObject({ kind: 'wait' });
  });

  it('turns: 0（minTurns: 2）→ wait、1 往復後（turns: 1 → 次は 2）→ due', () => {
    expect(due(armedWithTurns(0), defaultSettings(), 10)).toMatchObject({ kind: 'wait' });
    expect(due(armedWithTurns(1), defaultSettings(), 10)).toMatchObject({ kind: 'due' });
  });

  it('turns が everyNTurns で割り切れない → wait（interval）', () => {
    const settings = withJudge(defaultSettings(), { everyNTurns: 2 });
    // turns=1 → 次は 2 で割り切れる → due、turns=2 → 次は 3 で割り切れない → wait
    expect(due(armedWithTurns(1), settings, 10)).toMatchObject({ kind: 'due' });
    expect(due(armedWithTurns(2), settings, 10)).toMatchObject({ kind: 'wait' });
  });

  it('判断の回数が maxJudgements に達した → wait', () => {
    let run = armedWithTurns(1);
    for (let index = 0; index < 12; index += 1) {
      run = countJudgement(run, 10 + index);
    }
    expect(due(run, defaultSettings(), 100000)).toMatchObject({ kind: 'wait' });
  });

  it('促しを maxNudges 回出した → wait（already nudged）', () => {
    let run = armedWithTurns(1);
    run = nudge(run);
    expect(due(run, defaultSettings(), 10)).toMatchObject({ kind: 'wait' });
  });

  it('now が lastJudgedAt より前 → wait（too soon）、同じ時刻なら due', () => {
    const run = countJudgement(armedWithTurns(1), 10);
    expect(due(run, defaultSettings(), 9)).toMatchObject({ kind: 'wait', reason: 'too soon' });
    expect(due(run, defaultSettings(), 10)).toMatchObject({ kind: 'due' });
  });
});

describe('nudgeText', () => {
  it('reply と approve で同じ文を使う', () => {
    const settings = defaultSettings();
    expect(nudgeText(settings, 'reply')).toBe(settings.judge.stop.nudge);
    expect(nudgeText(settings, 'approve')).toBe(settings.judge.stop.nudge);
  });

  it('文面を差し替えると出る文が変わる（固定文字列では緑にならない）', () => {
    const base = defaultSettings();
    const settings: Settings = {
      ...base,
      judge: {
        ...base.judge,
        stop: {
          ...base.judge.stop,
          nudge: '独自の促し',
        },
      },
    };
    expect(nudgeText(settings, 'reply')).toBe('独自の促し');
    expect(nudgeText(settings, 'approve')).toBe('独自の促し');
  });
});
