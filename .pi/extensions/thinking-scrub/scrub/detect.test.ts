import { describe, expect, it } from 'vitest';
import { cycleText } from '../../../../test/scrub-fixture.ts';
import {
  MAX_PERIOD,
  MIN_LENGTH,
  MIN_PERIOD,
  MIN_REPEATS,
  detectRuns,
  scrubThinking,
} from './detect.ts';
import { MIN_CYCLES, MIN_RUN_CHARS } from './units.ts';

// 検出と除去。fixture は関数の中で組み立てる。

function unit(): string {
  return 'the *';
}

function repeated(pattern: string, times: number): string {
  return pattern.repeat(times);
}

function sentence(index: number): string {
  return `${unit()} ${index} proceeds with steady reasoning about the task and its details.`;
}

function sentenceWithChar(index: number): string {
  return `${unit()} ${index} thinks ${repeated(unit(), 12)} end.`;
}

describe('detectRuns', () => {
  it('離れた 2 か所に区間 → 2 区間で昇順', () => {
    const block = repeated(unit(), 12);
    const prefix = 'start';
    const middle = 'middle';
    const suffix = 'end';
    const text = `${prefix} ${block} ${middle} ${block} ${suffix}`;
    const runs = detectRuns(text);
    expect(runs).toHaveLength(2);
    expect(runs[0]?.at).toBeLessThan(runs[1]?.at ?? 0);
    expect(scrubThinking(text).removed).toBe(runs.length);
  });
});

describe('scrubThinking', () => {
  it('"the *" を 12 回並べた本文 → 1 区間で removed が 1、並びが消える', () => {
    const text = repeated(unit(), 12);
    // 周期 5 と周期 10 のどちらも当たるが、重なりは 1 区間にまとまる。
    const runs = detectRuns(text);
    expect(runs).toHaveLength(1);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(runs.length);
    expect(scrubbed.text).not.toContain(unit());
  });

  it('foo + "the *" × 5 + bar → 区間 1、foo bar', () => {
    const prefix = 'foo';
    const suffix = 'bar';
    const text = `${prefix}${repeated(unit(), 5)}${suffix}`;
    const expected = `${prefix} ${suffix}`;
    const runs = detectRuns(text);
    expect(runs).toHaveLength(1);
    expect(scrubThinking(text)).toEqual({ text: expected, removed: runs.length });
  });

  it(`周期 ${MIN_PERIOD} 文字は ${MIN_REPEATS + 2} 回で消え ${MIN_REPEATS + 1} 回では消えず、周期 ${MIN_LENGTH + 10} 文字は ${MIN_REPEATS} 回で消え ${MIN_REPEATS - 1} 回では消えない`, () => {
    // 周期の長さと繰り返しの数は別々に効く。前者は長さで、後者は回数で決まる。
    const minBlock = 'abcd';
    expect(minBlock.length).toBe(MIN_PERIOD);
    const longEnough = repeated(minBlock, MIN_REPEATS + 2);
    expect(longEnough.length).toBeGreaterThanOrEqual(MIN_LENGTH);
    expect(scrubThinking(longEnough).removed).toBe(1);
    const tooShort = repeated(minBlock, MIN_REPEATS + 1);
    expect(tooShort.length).toBeLessThan(MIN_LENGTH);
    const shortScrubbed = scrubThinking(tooShort);
    expect(shortScrubbed.removed).toBe(0);
    expect(shortScrubbed.text).toBe(tooShort);

    const midBlock = `${'a'.repeat(MIN_LENGTH + 9)}b`;
    expect(midBlock.length).toBe(MIN_LENGTH + 10);
    const enoughRepeats = repeated(midBlock, MIN_REPEATS);
    expect(enoughRepeats.length).toBeGreaterThanOrEqual(MIN_LENGTH);
    expect(scrubThinking(enoughRepeats).removed).toBe(1);
    const fewRepeats = repeated(midBlock, MIN_REPEATS - 1);
    expect(fewRepeats.length).toBeGreaterThanOrEqual(MIN_LENGTH);
    const fewScrubbed = scrubThinking(fewRepeats);
    expect(fewScrubbed.removed).toBe(0);
    expect(fewScrubbed.text).toBe(fewRepeats);
  });

  it(`周期 ${MIN_PERIOD - 1} 文字は消さず、${MAX_PERIOD} 文字は消し、${MAX_PERIOD + 1} 文字は消さない`, () => {
    const tooShortPeriod = 'abc';
    expect(tooShortPeriod.length).toBe(MIN_PERIOD - 1);
    const shortText = repeated(tooShortPeriod, 20);
    expect(shortText.length).toBeGreaterThanOrEqual(MIN_LENGTH);
    const shortScrubbed = scrubThinking(shortText);
    expect(shortScrubbed.removed).toBe(0);
    expect(shortScrubbed.text).toBe(shortText);

    const maxBlock = `${'a'.repeat(MAX_PERIOD - 1)}b`;
    expect(maxBlock.length).toBe(MAX_PERIOD);
    const maxText = repeated(maxBlock, MIN_REPEATS + 3);
    expect(scrubThinking(maxText).removed).toBe(1);

    const tooLongBlock = `${'a'.repeat(MAX_PERIOD)}b`;
    expect(tooLongBlock.length).toBe(MAX_PERIOD + 1);
    const longText = repeated(tooLongBlock, MIN_REPEATS + 3);
    const longScrubbed = scrubThinking(longText);
    expect(longScrubbed.removed).toBe(0);
    expect(longScrubbed.text).toBe(longText);
  });

  it('空文字 → removed が 0、本文が同一', () => {
    const scrubbed = scrubThinking('');
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe('');
  });

  it('反復の無い文章 → removed が 0、本文が同一', () => {
    const text = 'hello world, this is a normal sentence without repeats.';
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('境目の前後がどちらも非空白 → 空白 1 個、片方が空白 → 足さない', () => {
    const prefix = 'foo';
    const suffix = 'bar';
    const block = repeated(unit(), 12);
    const bothTight = `${prefix}${block}${suffix}`;
    expect(scrubThinking(bothTight).text).toBe(`${prefix} ${suffix}`);
    const leftSpaced = `${prefix} ${block}${suffix}`;
    expect(scrubThinking(leftSpaced).text).toBe(`${prefix} ${suffix}`);
    const rightSpaced = `${prefix}${block} ${suffix}`;
    expect(scrubThinking(rightSpaced).text).toBe(`${prefix} ${suffix}`);
  });

  it('区間が改行 2 つ / 1 つ / 無しを含む → 繋ぎ目にその改行を戻す', () => {
    const prefix = 'foo';
    const suffix = 'bar';
    const doubleReturn = '\n\n';
    const doubleText = `${prefix}${repeated(`${doubleReturn}The **`, 5)}${suffix}`;
    expect(scrubThinking(doubleText).text).toBe(`${prefix}${doubleReturn}${suffix}`);
    const singleReturn = '\n';
    const singleText = `${prefix}${repeated(`${singleReturn}abcd`, 12)}${suffix}`;
    expect(scrubThinking(singleText).text).toBe(`${prefix}${singleReturn}${suffix}`);
    const noReturnText = `${prefix}${repeated(unit(), 12)}${suffix}`;
    expect(scrubThinking(noReturnText).text).toBe(`${prefix} ${suffix}`);
  });

  it('区間が本文先頭 / 末尾にある → 詰めるだけで改行を足さない', () => {
    const suffix = 'bar';
    const prefix = 'foo';
    const headText = `${repeated('\n\nThe **', 5)}${suffix}`;
    expect(scrubThinking(headText).text).toBe(suffix);
    const tailText = `${prefix}${repeated('\n\nThe **', 5)}`;
    expect(scrubThinking(tailText).text).toBe(prefix);
  });

  it('結果にもう一度かける → removed が 0、本文が同一', () => {
    const prefix = 'foo';
    const suffix = 'bar';
    const text = `${prefix}${repeated(unit(), 12)}${suffix}`;
    const first = scrubThinking(text);
    expect(first.removed).toBe(1);
    const second = scrubThinking(first.text);
    expect(second.removed).toBe(0);
    expect(second.text).toBe(first.text);
  });
});

describe('scrubThinking sentence', () => {
  it(`文ループ ${MIN_CYCLES} 周期 → 最初の 1 周期だけ残り、残りが消える`, () => {
    const pattern = [sentence(0), sentence(1), sentence(2)];
    const text = cycleText(pattern, MIN_CYCLES);
    expect(text.length).toBeGreaterThanOrEqual(MIN_RUN_CHARS);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).toBe(pattern.join(' '));
  });

  it('各周期が文字ループを持つ文ループ → 文が先で removed が 2', () => {
    const pattern = [sentence(0), sentenceWithChar(1), sentence(2)];
    const text = cycleText(pattern, MIN_CYCLES);
    expect(text.length).toBeGreaterThanOrEqual(MIN_RUN_CHARS);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(2);
    expect(scrubbed.text).toContain(sentence(0));
    expect(scrubbed.text).not.toContain(repeated(unit(), 12));
  });

  it('柵を含む文ループ → 消えない', () => {
    const pattern = [sentence(0), sentence(1), sentence(2)];
    const cycle = pattern.join(' ');
    const fence = '```';
    const text = `${cycle}\n${fence}\ncode\n${fence}\n${cycle}\n${cycle}`;
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it(`${MIN_CYCLES} 周期でも ${MIN_RUN_CHARS} 文字未満の文ループ → 消えない`, () => {
    const one = sentence(0);
    const text = cycleText([one], MIN_CYCLES);
    expect(text.length).toBeLessThan(MIN_RUN_CHARS);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('消える周期が改行を含む → 繋ぎ目に同じ改行を戻す', () => {
    const pattern = [sentence(0), sentence(1), sentence(2)];
    const cycle = pattern.join(' ');
    const head = sentence(10);
    const tail = sentence(11);
    const doubleReturn = '\n\n';
    const doubleText = `${head}${doubleReturn}${cycle}${doubleReturn}${cycle}${doubleReturn}${cycle}${doubleReturn}${tail}`;
    expect(scrubThinking(doubleText).text).toBe(
      `${head}${doubleReturn}${cycle}${doubleReturn}${tail}`,
    );
    const singleReturn = '\n';
    const singleText = `${head}${singleReturn}${cycle}${singleReturn}${cycle}${singleReturn}${cycle}${singleReturn}${tail}`;
    expect(scrubThinking(singleText).text).toBe(
      `${head}${singleReturn}${cycle}${singleReturn}${tail}`,
    );
    const spacedText = `${head} ${cycle} ${cycle} ${cycle} ${tail}`;
    expect(scrubThinking(spacedText).text).toBe(`${head} ${cycle} ${tail}`);
  });
});
