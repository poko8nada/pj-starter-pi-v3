import { describe, expect, expectTypeOf, it } from 'vitest';
import { observeIn, thinkingWithRun } from '../scrub.fixture.ts';
import { defaultSettings } from '../settings/schema.ts';
import { emptyGuard, observe, resetOnUser, takeFollowUp } from './guard.ts';

// 長い thinking はファクトリで組み立てる。既定値は defaultSettings から読む。

function plainSentence(index: number): string {
  return `plain note ${index} walks through a different idea about the task at hand.`;
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

const tuning = defaultSettings();

describe('observe', () => {
  it('既定の live と閾値の長さのランなら stop になる', () => {
    const thinking = thinkingWithRun(tuning.live.minThinking);
    const step = observeIn(thinking);
    expect(step.kind).toBe('stop');
    if (step.kind !== 'stop') {
      throw new Error('must stop');
    }
    expect(step.guard.aborts).toBe(1);
    expect(step.guard.scanned).toBe(tuning.live.minThinking);
  });

  it('閾値より十分短い thinking なら idle で見た位置が進まない', () => {
    const thinking = thinkingWithRun(Math.floor(tuning.live.minThinking / 2));
    const step = observeIn(thinking, tuning);
    expect(step.kind).toBe('idle');
    if (step.kind !== 'idle') {
      throw new Error('must be idle');
    }
    expect(step.guard).toEqual(emptyGuard());
  });

  it('2 倍の tail 文字でランが末尾のウィンドウの外なら idle になる', () => {
    const firstHalf = thinkingWithRun(tuning.live.tail);
    const secondHalf = plainThinking(tuning.live.tail);
    const thinking = `${firstHalf} ${secondHalf}`.slice(0, tuning.live.tail * 2);
    const step = observeIn(thinking, tuning);
    expect(step.kind).toBe('idle');
  });

  it('2 倍の minThinking 文字のあと短い thinking なら scanned が戻り既定で止まる', () => {
    const long = plainThinking(tuning.live.minThinking * 2);
    const first = observeIn(long, tuning);
    expect(first.kind).toBe('idle');
    expect(first.guard.scanned).toBe(tuning.live.minThinking * 2);
    const short = thinkingWithRun(tuning.live.minThinking);
    const second = observe(first.guard, short, tuning, () => true);
    expect(second.kind).toBe('stop');
  });

  it('live.maxAborts を 0 にした設定なら idle になる', () => {
    const live = { ...tuning.live, maxAborts: 0 };
    const step = observeIn(thinkingWithRun(live.minThinking), { ...tuning, live });
    expect(step.kind).toBe('idle');
  });

  it('sentence.minRunChars を大きくした設定では既定で止まるランが idle になる', () => {
    const sentence = { ...tuning.sentence, minRunChars: 100_000 };
    const step = observeIn(thinkingWithRun(tuning.live.minThinking), { ...tuning, sentence });
    expect(step.kind).toBe('idle');
  });

  it('間隔が来ていないときは enabled が呼ばれない', () => {
    const base = thinkingWithRun(tuning.live.minThinking);
    const first = observeIn(base, tuning);
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
});

describe('resetOnUser', () => {
  it('空に戻ればまた止まれる', () => {
    const firstThinking = thinkingWithRun(tuning.live.minThinking);
    const first = observeIn(firstThinking, tuning);
    if (first.kind !== 'stop') {
      throw new Error('first must stop');
    }
    const secondThinking = thinkingWithRun(tuning.live.minThinking * 2);
    const second = observe(first.guard, secondThinking, tuning, () => true);
    if (second.kind !== 'stop') {
      throw new Error('second must stop');
    }
    const reset = resetOnUser();
    const again = observe(reset, thinkingWithRun(tuning.live.minThinking), tuning, () => true);
    expect(again.kind).toBe('stop');
  });
});

describe('takeFollowUp', () => {
  it('2 回止めれば 1 回だけ取れる', () => {
    const first = observeIn(thinkingWithRun(tuning.live.minThinking), tuning);
    if (first.kind !== 'stop') {
      throw new Error('first must stop');
    }
    const second = observe(
      first.guard,
      thinkingWithRun(tuning.live.minThinking + tuning.live.scanEvery),
      tuning,
      () => true,
    );
    if (second.kind !== 'stop') {
      throw new Error('second must stop');
    }
    const taken = takeFollowUp(second.guard);
    if (taken === undefined) {
      throw new Error('must take');
    }
    expect(taken.pending).toBe(false);
    expect(takeFollowUp(taken)).toBeUndefined();
  });
});

describe('signature', () => {
  it('読まれない引数を受けない', () => {
    expectTypeOf<Parameters<typeof resetOnUser>>().toEqualTypeOf<[]>();
  });
});
