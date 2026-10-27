import { describe, expect, it } from 'vitest';
import {
  FOLLOWUP_CONTINUE,
  FOLLOWUP_DO_NOT,
  FOLLOWUP_REPEATING,
  loopSentence,
  thinkingWithRun,
} from '../scrub.fixture.ts';
import { defaultSettings } from '../settings/schema.ts';
import { emptyGuard, followUpText, observe, resetOnUser, takeFollowUp } from './guard.ts';

// 長い thinking は factory で組み立てる。既定値は defaultSettings から読む。

function plainSentence(index: number): string {
  return `plain note ${index} walks through a different idea about the task at hand.`;
}

function thinkingWithOtherRun(length: number): string {
  return thinkingWithRun(length, 10);
}

function plainThinking(length: number): string {
  const parts: string[] = [];
  let index = 0;
  let text = '';
  while (text.length < length) {
    const next = plainSentence(index);
    index += 1;
    parts.push(next);
    text = parts.join(' ');
  }
  return text.slice(0, length);
}

describe('observe', () => {
  it('既定の live と 20000 文字の run → stop で見本つき', () => {
    const tuning = defaultSettings();
    const thinking = thinkingWithRun(20_000);
    expect(thinking).toHaveLength(20_000);
    const step = observe(emptyGuard(), thinking, tuning, () => true);
    expect(step.kind).toBe('stop');
    if (step.kind !== 'stop') {
      throw new Error('must stop');
    }
    expect(step.sample.length).toBeGreaterThan(0);
    expect(step.sample.length).toBeLessThanOrEqual(tuning.live.sampleChars);
    expect(step.guard.aborts).toBe(1);
    expect(step.guard.scanned).toBe(20_000);
  });

  it('19999 文字に run → idle', () => {
    const tuning = defaultSettings();
    const thinking = thinkingWithRun(20_000).slice(0, 19_999);
    expect(thinking).toHaveLength(19_999);
    const step = observe(emptyGuard(), thinking, tuning, () => true);
    expect(step.kind).toBe('idle');
  });

  it('同じ thinking に scanEvery 未満だけ足す → idle', () => {
    const tuning = defaultSettings();
    const base = thinkingWithRun(20_000);
    const first = observe(emptyGuard(), base, tuning, () => true);
    if (first.kind !== 'stop') {
      throw new Error('first must stop');
    }
    const extended = `${base}${'x'.repeat(tuning.live.scanEvery - 1)}`;
    expect(extended.length - first.guard.scanned).toBe(tuning.live.scanEvery - 1);
    const second = observe(first.guard, extended, tuning, () => true);
    expect(second.kind).toBe('idle');
  });

  it('2 倍の tail 文字で run が末尾の窓の外 → idle', () => {
    const tuning = defaultSettings();
    const firstHalf = thinkingWithRun(tuning.live.tail);
    const secondHalf = plainThinking(tuning.live.tail);
    const thinking = `${firstHalf} ${secondHalf}`.slice(0, tuning.live.tail * 2);
    expect(thinking).toHaveLength(tuning.live.tail * 2);
    const step = observe(emptyGuard(), thinking, tuning, () => true);
    expect(step.kind).toBe('idle');
  });

  it('2 倍の minThinking 文字のあと短い thinking → scanned が戻り既定で止まる', () => {
    const tuning = defaultSettings();
    const long = plainThinking(tuning.live.minThinking * 2);
    const first = observe(emptyGuard(), long, tuning, () => true);
    expect(first.kind).toBe('idle');
    expect(first.guard.scanned).toBe(tuning.live.minThinking * 2);
    const short = thinkingWithRun(tuning.live.minThinking);
    const second = observe(first.guard, short, tuning, () => true);
    expect(second.kind).toBe('stop');
  });

  it('maxAborts 回のあと 2 倍の minThinking 文字 → idle', () => {
    const tuning = defaultSettings();
    const firstThinking = thinkingWithRun(tuning.live.minThinking);
    const first = observe(emptyGuard(), firstThinking, tuning, () => true);
    if (first.kind !== 'stop') {
      throw new Error('first must stop');
    }
    const secondThinking = thinkingWithRun(tuning.live.minThinking * 2);
    const second = observe(first.guard, secondThinking, tuning, () => true);
    if (second.kind !== 'stop') {
      throw new Error('second must stop');
    }
    expect(second.guard.aborts).toBe(tuning.live.maxAborts);
    const third = observe(
      second.guard,
      thinkingWithRun(tuning.live.minThinking * 2),
      tuning,
      () => true,
    );
    expect(third.kind).toBe('idle');
  });

  it('live.minThinking を 5000 にした設定で、5000 文字のラン → stop', () => {
    const tuning = defaultSettings();
    const live = { ...tuning.live, minThinking: 5000 };
    const thinking = thinkingWithRun(5000);
    expect(thinking).toHaveLength(5000);
    const step = observe(emptyGuard(), thinking, { ...tuning, live }, () => true);
    expect(step.kind).toBe('stop');
  });

  it('live.maxAborts を 0 にした設定 → idle', () => {
    const tuning = defaultSettings();
    const live = { ...tuning.live, maxAborts: 0 };
    const step = observe(
      emptyGuard(),
      thinkingWithRun(live.minThinking),
      { ...tuning, live },
      () => true,
    );
    expect(step.kind).toBe('idle');
  });

  it('sentence.minRunChars を大きくした設定では、既定で止まるラン → idle', () => {
    const tuning = defaultSettings();
    const sentence = { ...tuning.sentence, minRunChars: 100_000 };
    const step = observe(
      emptyGuard(),
      thinkingWithRun(tuning.live.minThinking),
      { ...tuning, sentence },
      () => true,
    );
    expect(step.kind).toBe('idle');
  });

  it('無効のとき、間隔が来たスキャンで scanned が進む', () => {
    const tuning = defaultSettings();
    const step = observe(
      emptyGuard(),
      thinkingWithRun(tuning.live.minThinking),
      tuning,
      () => false,
    );
    expect(step.kind).toBe('idle');
    expect(step.guard.scanned).toBe(tuning.live.minThinking);
  });

  it('間隔が来ていないとき、enabled が呼ばれない', () => {
    const tuning = defaultSettings();
    const base = thinkingWithRun(tuning.live.minThinking);
    const first = observe(emptyGuard(), base, tuning, () => true);
    if (first.kind !== 'stop') {
      throw new Error('first must stop');
    }
    let calls = 0;
    const extended = `${base}${'x'.repeat(tuning.live.scanEvery - 1)}`;
    const second = observe(first.guard, extended, tuning, () => {
      calls += 1;
      return true;
    });
    expect(second.kind).toBe('idle');
    expect(calls).toBe(0);
  });

  it('MAX_ABORTS に達したら、scanned が進み、enabled が呼ばれない', () => {
    const tuning = defaultSettings();
    const first = observe(
      emptyGuard(),
      thinkingWithRun(tuning.live.minThinking),
      tuning,
      () => true,
    );
    if (first.kind !== 'stop') {
      throw new Error('first must stop');
    }
    const second = observe(
      first.guard,
      thinkingWithRun(tuning.live.minThinking * 2),
      tuning,
      () => true,
    );
    if (second.kind !== 'stop') {
      throw new Error('second must stop');
    }
    expect(second.guard.aborts).toBe(tuning.live.maxAborts);
    let calls = 0;
    const thirdThinking = thinkingWithRun(tuning.live.minThinking * 2);
    const third = observe(second.guard, thirdThinking, tuning, () => {
      calls += 1;
      return true;
    });
    expect(third.kind).toBe('idle');
    expect(third.guard.scanned).toBe(thirdThinking.length);
    expect(calls).toBe(0);
  });
});

describe('resetOnUser', () => {
  it('空に戻り、また止まれる', () => {
    const tuning = defaultSettings();
    const firstThinking = thinkingWithRun(tuning.live.minThinking);
    const first = observe(emptyGuard(), firstThinking, tuning, () => true);
    if (first.kind !== 'stop') {
      throw new Error('first must stop');
    }
    const secondThinking = thinkingWithRun(tuning.live.minThinking * 2);
    const second = observe(first.guard, secondThinking, tuning, () => true);
    if (second.kind !== 'stop') {
      throw new Error('second must stop');
    }
    const reset = resetOnUser(second.guard);
    expect(reset).toEqual(emptyGuard());
    const again = observe(reset, thinkingWithRun(tuning.live.minThinking), tuning, () => true);
    expect(again.kind).toBe('stop');
  });
});

describe('takeFollowUp', () => {
  it('2 回止める → 最新が見本で 1 回だけ取れる', () => {
    const tuning = defaultSettings();
    const firstThinking = thinkingWithRun(tuning.live.minThinking);
    const first = observe(emptyGuard(), firstThinking, tuning, () => true);
    if (first.kind !== 'stop') {
      throw new Error('first must stop');
    }
    const secondThinking = thinkingWithOtherRun(tuning.live.minThinking + tuning.live.scanEvery);
    const second = observe(first.guard, secondThinking, tuning, () => true);
    if (second.kind !== 'stop') {
      throw new Error('second must stop');
    }
    expect(second.sample).not.toBe(first.sample);
    const taken = takeFollowUp(second.guard);
    expect(taken?.sample).toBe(second.sample);
    if (taken === undefined) {
      throw new Error('must take');
    }
    expect(takeFollowUp(taken.guard)).toBeUndefined();
  });
});

describe('followUpText', () => {
  it('指示と見本を含み、長い見本は切れる', () => {
    const live = defaultSettings().live;
    const sample = loopSentence(0);
    const text = followUpText(sample, live.sampleChars);
    expect(text).toContain(FOLLOWUP_REPEATING);
    expect(text).toContain(FOLLOWUP_DO_NOT);
    expect(text).toContain(FOLLOWUP_CONTINUE);
    expect(text).toContain(sample);
    const longSample = [loopSentence(0), loopSentence(0), loopSentence(0), loopSentence(0)].join(
      ' ',
    );
    expect(longSample.length).toBeGreaterThan(live.sampleChars);
    const cut = followUpText(longSample, live.sampleChars);
    expect(cut).toContain(longSample.slice(0, live.sampleChars));
    expect(cut).not.toContain(longSample);
  });

  it('followUpText(sample, 10) → 見本が 10 文字に切られる', () => {
    const sample = loopSentence(0);
    expect(sample.length).toBeGreaterThan(10);
    const text = followUpText(sample, 10);
    expect(text).toContain(sample.slice(0, 10));
    expect(text).not.toContain(sample);
  });
});
