import { describe, expect, it } from 'vitest';
import {
  FOLLOWUP_CONTINUE,
  FOLLOWUP_DO_NOT,
  FOLLOWUP_REPEATING,
  loopSentence,
  thinkingWithRun,
} from '../../../../test/scrub-fixture.ts';
import {
  emptyGuard,
  followUpText,
  MAX_ABORTS,
  MIN_THINKING,
  observe,
  resetOnUser,
  SCAN_EVERY,
  TAIL,
  takeFollowUp,
} from './guard.ts';
import { MIN_CYCLES, SAMPLE_CHARS } from '../scrub/units.ts';

// 長い thinking は factory で組み立てる。定数は名前で使う。

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
  it(`${MIN_THINKING} 文字に ${MIN_CYCLES} 周期の run → stop で見本つき`, () => {
    const thinking = thinkingWithRun(MIN_THINKING);
    expect(thinking).toHaveLength(MIN_THINKING);
    const step = observe(emptyGuard(), thinking);
    expect(step.kind).toBe('stop');
    if (step.kind !== 'stop') {
      throw new Error('must stop');
    }
    expect(step.sample.length).toBeGreaterThan(0);
    expect(step.sample.length).toBeLessThanOrEqual(SAMPLE_CHARS);
    expect(step.guard.aborts).toBe(1);
    expect(step.guard.scanned).toBe(MIN_THINKING);
  });

  it(`${MIN_THINKING - 1} 文字に run → idle`, () => {
    const thinking = thinkingWithRun(MIN_THINKING).slice(0, MIN_THINKING - 1);
    expect(thinking).toHaveLength(MIN_THINKING - 1);
    const step = observe(emptyGuard(), thinking);
    expect(step.kind).toBe('idle');
  });

  it(`同じ thinking に ${SCAN_EVERY} 未満だけ足す → idle`, () => {
    const base = thinkingWithRun(MIN_THINKING);
    const first = observe(emptyGuard(), base);
    if (first.kind !== 'stop') {
      throw new Error('first must stop');
    }
    const extended = `${base}${'x'.repeat(SCAN_EVERY - 1)}`;
    expect(extended.length - first.guard.scanned).toBe(SCAN_EVERY - 1);
    const second = observe(first.guard, extended);
    expect(second.kind).toBe('idle');
  });

  it(`2 倍の ${TAIL} 文字で run が末尾の窓の外 → idle`, () => {
    const firstHalf = thinkingWithRun(TAIL);
    const secondHalf = plainThinking(TAIL);
    const thinking = `${firstHalf} ${secondHalf}`.slice(0, TAIL * 2);
    expect(thinking).toHaveLength(TAIL * 2);
    const step = observe(emptyGuard(), thinking);
    expect(step.kind).toBe('idle');
  });

  it(`2 倍の ${MIN_THINKING} 文字のあと短い thinking → scanned が戻り ${MIN_THINKING} で止まる`, () => {
    const long = plainThinking(MIN_THINKING * 2);
    const first = observe(emptyGuard(), long);
    expect(first.kind).toBe('idle');
    expect(first.guard.scanned).toBe(MIN_THINKING * 2);
    const short = thinkingWithRun(MIN_THINKING);
    const second = observe(first.guard, short);
    expect(second.kind).toBe('stop');
  });

  it(`${MAX_ABORTS} 回のあと 2 倍の ${MIN_THINKING} 文字 → idle`, () => {
    const firstThinking = thinkingWithRun(MIN_THINKING);
    const first = observe(emptyGuard(), firstThinking);
    if (first.kind !== 'stop') {
      throw new Error('first must stop');
    }
    const secondThinking = thinkingWithRun(MIN_THINKING * 2);
    const second = observe(first.guard, secondThinking);
    if (second.kind !== 'stop') {
      throw new Error('second must stop');
    }
    expect(second.guard.aborts).toBe(MAX_ABORTS);
    const third = observe(second.guard, thinkingWithRun(MIN_THINKING * 2));
    expect(third.kind).toBe('idle');
  });
});

describe('resetOnUser', () => {
  it('空に戻り、また止まれる', () => {
    const firstThinking = thinkingWithRun(MIN_THINKING);
    const first = observe(emptyGuard(), firstThinking);
    if (first.kind !== 'stop') {
      throw new Error('first must stop');
    }
    const secondThinking = thinkingWithRun(MIN_THINKING * 2);
    const second = observe(first.guard, secondThinking);
    if (second.kind !== 'stop') {
      throw new Error('second must stop');
    }
    const reset = resetOnUser(second.guard);
    expect(reset).toEqual(emptyGuard());
    const again = observe(reset, thinkingWithRun(MIN_THINKING));
    expect(again.kind).toBe('stop');
  });
});

describe('takeFollowUp', () => {
  it('2 回止める → 最新が見本で 1 回だけ取れる', () => {
    const firstThinking = thinkingWithRun(MIN_THINKING);
    const first = observe(emptyGuard(), firstThinking);
    if (first.kind !== 'stop') {
      throw new Error('first must stop');
    }
    const secondThinking = thinkingWithOtherRun(MIN_THINKING + SCAN_EVERY);
    const second = observe(first.guard, secondThinking);
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
    const sample = loopSentence(0);
    const text = followUpText(sample);
    expect(text).toContain(FOLLOWUP_REPEATING);
    expect(text).toContain(FOLLOWUP_DO_NOT);
    expect(text).toContain(FOLLOWUP_CONTINUE);
    expect(text).toContain(sample);
    const longSample = [loopSentence(0), loopSentence(0), loopSentence(0), loopSentence(0)].join(
      ' ',
    );
    expect(longSample.length).toBeGreaterThan(SAMPLE_CHARS);
    const cut = followUpText(longSample);
    expect(cut).toContain(longSample.slice(0, SAMPLE_CHARS));
    expect(cut).not.toContain(longSample);
  });
});
