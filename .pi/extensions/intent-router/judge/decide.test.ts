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
function armedWithTurns(turns: number, choice: 'reply' | 'approve' = 'reply') {
  let run = arm({
    ownerNow: 'hello',
    choice,
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
  it('related=yes answerable=no（どちらも閾値以上）→ 促しは出ない', () => {
    expect(decideJudge(answers('yes', 0.95, 'no', 0.95), defaultSettings(), 0)).toMatchObject({
      kind: 'wait',
    });
  });

  it('answerable=yes（閾値以上）→ 促しが 1 回出る', () => {
    expect(decideJudge(answers('yes', 0.95, 'yes', 0.95), defaultSettings(), 0)).toMatchObject({
      kind: 'nudge',
      why: 'answerable',
    });
  });

  it('related=no が 1 往復目 → 出ない', () => {
    expect(decideJudge(answers('no', 0.95, 'no', 0.95), defaultSettings(), 0)).toMatchObject({
      kind: 'wait',
      unrelated: 1,
    });
  });

  it('related=no が 2 往復目 → 促しが出る', () => {
    expect(decideJudge(answers('no', 0.95, 'no', 0.95), defaultSettings(), 1)).toMatchObject({
      kind: 'nudge',
      why: 'unrelated',
      unrelated: 2,
    });
  });

  it('related=no と yes が交互 → 合計で数えて 2 回目の no で出る', () => {
    const first = decideJudge(answers('no', 0.95, 'no', 0.95), defaultSettings(), 0);
    expect(first).toMatchObject({ kind: 'wait', unrelated: 1 });
    if (first.kind !== 'wait') {
      throw new Error('must be wait');
    }
    const second = decideJudge(
      answers('yes', 0.95, 'no', 0.95),
      defaultSettings(),
      first.unrelated,
    );
    expect(second).toMatchObject({ kind: 'wait', unrelated: 1 });
    if (second.kind !== 'wait') {
      throw new Error('must be wait');
    }
    expect(
      decideJudge(answers('no', 0.95, 'no', 0.95), defaultSettings(), second.unrelated),
    ).toMatchObject({ kind: 'nudge', why: 'unrelated', unrelated: 2 });
  });

  it('related の confidence が閾値未満 → unrelated は増えない', () => {
    expect(decideJudge(answers('no', 0.79, 'no', 0.95), defaultSettings(), 0)).toMatchObject({
      kind: 'wait',
      unrelated: 0,
    });
  });

  it('answerable の confidence が閾値未満 → 促しは出ない', () => {
    expect(decideJudge(answers('yes', 0.95, 'yes', 0.79), defaultSettings(), 0)).toMatchObject({
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
        0,
      ),
    ).toMatchObject({ kind: 'wait', unrelated: 0 });
  });
});

describe('due', () => {
  it('idle の run → wait', () => {
    expect(due(idleRun(), defaultSettings(), 10)).toMatchObject({ kind: 'wait' });
  });

  it('approve の往復 → wait（2 段目は reply だけ）', () => {
    expect(due(armedWithTurns(1, 'approve'), defaultSettings(), 10)).toMatchObject({
      kind: 'wait',
    });
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
